import User from "../models/userModel.js";
import {
  isGoogleSheetsConfigured,
  getServiceAccountEmail,
  createSpreadsheet,
  shareFileWithEmail,
  spreadsheetExists,
  syncTab,
} from "./googleSheetsService.js";

// Every admin / super-admin writes their dashboard exports into ONE Google
// Spreadsheet of their own, one tab per data type:
//
//   Admin 1      -> Sheet 1   (tabs: Applications, Internships & Jobs, ...)
//   Admin 2      -> Sheet 2
//   Super Admin  -> Super Admin Sheet  (tabs: Admins, Users, Mentors, Applications, ...)
//
// How each account's sheet is resolved, in order:
//   1. `User.exportSpreadsheetId` — a sheet the account (or a super-admin) linked
//      by pasting its URL. Must be shared with the service account as Editor.
//   2. `GOOGLE_SHEETS_FALLBACK_SPREADSHEET_ID` env — a shared catch-all sheet.
//   3. Auto-create one with the service account. This only works when the
//      service account can create Drive files (Workspace domain / shared drive /
//      delegation); on a plain GCP project it returns 403 and the account must
//      link a sheet manually (status "needs_setup").

const ROLE_LABEL = {
  admin: "Admin",
  super_admin: "Super Admin",
  mentor: "Mentor",
  user: "User",
};

const spreadsheetTitleFor = (account) => {
  const name = account.fullName || account.email || "Account";
  const role = ROLE_LABEL[account.role] || "Account";
  return `Edeco Exports – ${name} (${role})`;
};

const isPermissionError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

// Resolves the spreadsheet id to write into. Throws a tagged error when the
// account has no usable sheet and one can't be created.
const resolveSpreadsheetId = async (userId) => {
  const account = await User.findById(userId).select(
    "fullName email role exportSpreadsheetId",
  );
  if (!account) throw new Error("Account not found for export sheet.");

  // 1. Explicitly linked sheet.
  if (account.exportSpreadsheetId) {
    if (await spreadsheetExists(account.exportSpreadsheetId)) {
      return account.exportSpreadsheetId;
    }
    const err = new Error(
      "The linked Google Sheet can't be opened. Re-link a sheet and make sure it's shared with " +
        `${getServiceAccountEmail()} as Editor.`,
    );
    err.code = "NEEDS_SETUP";
    throw err;
  }

  // 2. Shared catch-all sheet from env.
  const fallback = process.env.GOOGLE_SHEETS_FALLBACK_SPREADSHEET_ID;
  if (fallback) return fallback;

  // 3. Try to auto-create (works on Workspace / shared-drive setups only).
  try {
    const { spreadsheetId } = await createSpreadsheet(spreadsheetTitleFor(account));
    await User.updateOne(
      { _id: account._id },
      { $set: { exportSpreadsheetId: spreadsheetId } },
    );
    try {
      await shareFileWithEmail(spreadsheetId, account.email);
    } catch (shareError) {
      console.error(
        "[user-export-sheet] could not share auto-created sheet with",
        account.email,
        "-",
        shareError?.response?.data?.error?.message || shareError.message,
      );
    }
    return spreadsheetId;
  } catch (createError) {
    if (isPermissionError(createError)) {
      const err = new Error(
        "This server's Google service account can't create spreadsheets. " +
          `Create a Google Sheet, share it with ${getServiceAccountEmail()} as Editor, ` +
          "and link it to this account.",
      );
      err.code = "NEEDS_SETUP";
      throw err;
    }
    throw createError;
  }
};

/**
 * Mirrors one export into the calling account's spreadsheet.
 *
 * @param {object}   params
 * @param {object}   params.user     req.user (needs _id)
 * @param {string}   params.tabName  e.g. "Applications", "Admins", "Internships"
 * @param {object[]} params.rows     array of plain objects (keys become columns)
 * @param {string[]} [params.headers] column order; defaults to keys of rows[0]
 * @returns {Promise<{status: string, url?: string, error?: string}>} never throws
 */
export const syncExportToUserSheet = async ({ user, tabName, rows, headers }) => {
  if (!isGoogleSheetsConfigured()) return { status: "not_configured" };
  if (!user?._id) return { status: "not_configured" };

  const cols =
    headers && headers.length
      ? headers
      : rows.length
        ? Object.keys(rows[0])
        : [];

  if (!cols.length) return { status: "empty" };

  try {
    const spreadsheetId = await resolveSpreadsheetId(user._id);
    const url = await syncTab({ spreadsheetId, tabName, headers: cols, rows });
    return { status: "synced", url };
  } catch (error) {
    if (error.code === "NEEDS_SETUP") {
      return { status: "needs_setup", error: error.message };
    }

    // Readable but not writable — the sheet is shared as Viewer, not Editor.
    if (error?.response?.status === 403) {
      return {
        status: "needs_setup",
        error:
          `The linked Google Sheet is read-only for the app. Open it → Share → set ${getServiceAccountEmail()} to "Editor", then try again.`,
      };
    }

    const gErr = error?.response?.data?.error;
    const detail =
      (typeof gErr === "object" ? gErr?.message : gErr) ||
      error?.response?.data?.error_description ||
      error.message ||
      "Unknown error";
    console.error(
      `[user-export-sheet] sync failed (tab "${tabName}") status=${error?.response?.status}:`,
      JSON.stringify(error?.response?.data || { message: error.message }),
    );
    return { status: "failed", error: detail, httpStatus: error?.response?.status || 0 };
  }
};

/**
 * Sets X-Google-Sheet-* headers from a syncExportToUserSheet() result.
 * HTTP header values must be Latin-1 with no control chars — Node throws
 * ERR_INVALID_CHAR otherwise — so the error string is stripped to printable
 * ASCII before being set.
 */
export const applySheetSyncHeaders = (res, sync) => {
  if (!sync) return;
  try {
    res.setHeader("X-Google-Sheet-Status", sync.status || "");
    if (sync.url) res.setHeader("X-Google-Sheet-Url", String(sync.url).replace(/[^\x20-\x7E]+/g, ""));
    if (sync.error) {
      res.setHeader(
        "X-Google-Sheet-Error",
        String(sync.error).replace(/[^\x20-\x7E]+/g, " ").trim().slice(0, 300),
      );
    }
  } catch {
    // A malformed header value must never break the response it rides on.
  }
};

const SHEET_ID_RE = /[a-zA-Z0-9-_]{20,}/;

/** Accepts a full Google Sheets URL or a bare id and returns the id (or ""). */
export const extractSpreadsheetId = (input) => {
  const value = String(input || "").trim();
  if (!value) return "";
  const fromUrl = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (fromUrl) return fromUrl[1];
  const bare = value.match(SHEET_ID_RE);
  return bare ? bare[0] : "";
};
