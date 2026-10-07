import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import axios from "axios";

// Minimal Google Sheets + Drive client. We only need to: create a spreadsheet,
// share it with one person, and overwrite a named tab with a fresh table. Rather
// than pull in the very large `googleapis` package we sign a service-account JWT
// ourselves (jsonwebtoken + axios are already dependencies) and call the REST
// APIs directly.
//
// Requires, on the GCP project that owns the service account:
//   - Google Sheets API enabled
//   - Google Drive API enabled  (for creating + sharing the spreadsheet)

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file", // only files this SA created
].join(" ");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  path.join(process.cwd(), "config", "google-service-account.json");

let cachedCredentials; // undefined = not loaded yet, null = unavailable
let cachedToken = { value: null, expiresAt: 0 };

const loadCredentials = () => {
  if (cachedCredentials !== undefined) return cachedCredentials;

  try {
    const parsed = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    cachedCredentials =
      parsed && parsed.client_email && parsed.private_key ? parsed : null;
  } catch {
    cachedCredentials = null;
  }

  return cachedCredentials;
};

// True when the service-account file is present and parseable.
export const isGoogleSheetsConfigured = () => Boolean(loadCredentials());

export const getServiceAccountEmail = () => loadCredentials()?.client_email || "";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAccessToken = async () => {
  const creds = loadCredentials();
  if (!creds) {
    throw new Error("Google service account credentials are not available.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken.value && cachedToken.expiresAt - 60 > now) {
    return cachedToken.value;
  }

  const assertion = jwt.sign(
    { iss: creds.client_email, scope: SCOPES, aud: TOKEN_URL, iat: now, exp: now + 3600 },
    creds.private_key,
    { algorithm: "RS256" },
  );

  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 },
  );

  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in || 3600),
  };
  return cachedToken.value;
};

// Google's APIs return sporadic 429/500/502/503/504 ("The service is currently
// unavailable") under normal operation — their own guidance is to retry with
// exponential backoff. Wrap every call in that.
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 5;

const gapi = async (config) => {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await axios({
        timeout: 20000,
        ...config,
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          ...(config.headers || {}),
        },
      });
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const retryable =
        RETRY_STATUS.has(status) ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNABORTED";

      if (!retryable || attempt === MAX_ATTEMPTS - 1) throw error;

      // 1s, 2s, 4s, 8s (+ up to 1s jitter)
      await sleep(1000 * 2 ** attempt + Math.floor(Math.random() * 1000));
    }
  }
  throw lastError;
};

// A1 notation needs the tab title single-quoted (inner quotes doubled) so titles
// with spaces or punctuation don't break the range.
const quoteTitle = (title) => `'${String(title).replace(/'/g, "''")}'`;

/** Creates an empty spreadsheet and returns { spreadsheetId, spreadsheetUrl }. */
export const createSpreadsheet = async (title) => {
  const { data } = await gapi({
    method: "post",
    url: SHEETS_API,
    data: { properties: { title } },
  });
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
  };
};

/** Grants `email` write access to a file the service account owns. */
export const shareFileWithEmail = async (fileId, email) => {
  if (!email) return;
  await gapi({
    method: "post",
    url: `${DRIVE_API}/files/${fileId}/permissions?sendNotificationEmail=false`,
    data: { type: "user", role: "writer", emailAddress: email },
  });
};

/**
 * Returns the spreadsheet's tabs as `{ title, sheetId }`, or throws if it
 * can't be read. The numeric `sheetId` (not the title) is what cell-formatting
 * requests address, so it is fetched alongside the title.
 */
const getTabs = async (spreadsheetId) => {
  const { data } = await gapi({
    method: "get",
    url: `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties(title,sheetId)`,
  });
  return (data.sheets || []).map((s) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));
};

/** Creates the tab if it isn't there yet. Returns its numeric sheetId. */
const ensureTab = async (spreadsheetId, tabName) => {
  const tabs = await getTabs(spreadsheetId);
  const existing = tabs.find((t) => t.title === tabName);
  if (existing) return existing.sheetId;

  const { data } = await gapi({
    method: "post",
    url: `${SHEETS_API}/${spreadsheetId}:batchUpdate`,
    data: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  return data?.replies?.[0]?.addSheet?.properties?.sheetId ?? null;
};

// Header row styling: bold, a step larger than the body, white on the project
// navy, frozen so it stays put while scrolling a long export.
const HEADER_BACKGROUND = { red: 0.12, green: 0.16, blue: 0.33 }; // #1F2853
const HEADER_FONT_SIZE = 12;
const BODY_FONT_SIZE = 10;

const formatHeaderRow = async ({ spreadsheetId, sheetId, columnCount }) => {
  if (sheetId === null || sheetId === undefined || !columnCount) return;

  await gapi({
    method: "post",
    url: `${SHEETS_API}/${spreadsheetId}:batchUpdate`,
    data: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: HEADER_BACKGROUND,
                verticalAlignment: "MIDDLE",
                textFormat: {
                  bold: true,
                  fontSize: HEADER_FONT_SIZE,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                },
              },
            },
            fields:
              "userEnteredFormat(backgroundColor,verticalAlignment,textFormat)",
          },
        },
        // Explicit body size so the header reads as bigger even where the
        // sheet's default font size differs.
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: columnCount,
            },
            cell: {
              userEnteredFormat: { textFormat: { bold: false, fontSize: BODY_FONT_SIZE } },
            },
            fields: "userEnteredFormat(textFormat)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: columnCount,
            },
          },
        },
      ],
    },
  });
};

/**
 * Overwrites tab `tabName` of `spreadsheetId` with `headers` (one row) followed
 * by `rows` (array of objects keyed by header). Creates the tab if needed.
 * Returns the spreadsheet's shareable URL.
 */
export const syncTab = async ({ spreadsheetId, tabName, headers, rows }) => {
  if (!spreadsheetId) throw new Error("Missing spreadsheetId.");
  if (!tabName) throw new Error("Missing tabName.");

  const sheetId = await ensureTab(spreadsheetId, tabName);
  const tab = quoteTitle(tabName);

  await gapi({
    method: "post",
    url: `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A:ZZ`)}:clear`,
    data: {},
  });

  const values = [
    headers,
    ...rows.map((row) => headers.map((key) => row[key] ?? "")),
  ];

  await gapi({
    method: "put",
    url: `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(`${tab}!A1`)}?valueInputOption=RAW`,
    data: { values },
  });

  // Cosmetic only, and it runs after the data is already committed — a styling
  // failure must not turn a successful sync into a reported error.
  try {
    await formatHeaderRow({ spreadsheetId, sheetId, columnCount: headers.length });
  } catch (error) {
    console.warn(
      `[user-export-sheet] header formatting skipped for tab "${tabName}":`,
      error?.response?.data?.error?.message || error.message,
    );
  }

  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
};

/**
 * Whether we should keep using this spreadsheet id. Only a definitive 404/403
 * ("gone" / "no access") means re-create; a transient error is treated as
 * "still there" so we never orphan a working sheet over a blip.
 */
export const spreadsheetExists = async (spreadsheetId) => {
  try {
    await gapi({
      method: "get",
      url: `${SHEETS_API}/${spreadsheetId}?fields=spreadsheetId`,
    });
    return true;
  } catch (error) {
    const status = error?.response?.status;
    // 404 (gone) / 403 (no access) / 400 (bad id) => don't use it.
    // A network / 5xx blip => assume it's still fine, don't re-create.
    if (status === 404 || status === 403 || status === 400) return false;
    return true;
  }
};

/**
 * Probes whether the service account can actually WRITE to the spreadsheet
 * (i.e. it's shared as Editor, not Viewer). Reads the first tab's A1 and writes
 * the same value straight back — a real no-op write. Returns:
 *   "ok"        — writable
 *   "read_only" — readable but not writable (shared as Viewer)
 *   "no_access" — can't even read it (wrong id / not shared / not enabled)
 */
export const checkSpreadsheetAccess = async (spreadsheetId) => {
  let title;
  try {
    const meta = await gapi({
      method: "get",
      url: `${SHEETS_API}/${spreadsheetId}?fields=sheets.properties.title`,
    });
    title = meta.data.sheets?.[0]?.properties?.title;
    if (!title) return "no_access";
  } catch {
    return "no_access";
  }

  const range = encodeURIComponent(`${quoteTitle(title)}!A1`);
  try {
    const cur = await gapi({
      method: "get",
      url: `${SHEETS_API}/${spreadsheetId}/values/${range}`,
    });
    const value = cur.data.values?.[0]?.[0] ?? "";
    await gapi({
      method: "put",
      url: `${SHEETS_API}/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      data: { values: [[value]] },
    });
    return "ok";
  } catch (error) {
    if (error?.response?.status === 403) return "read_only";
    throw error;
  }
};
