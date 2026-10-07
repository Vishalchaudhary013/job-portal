import ExcelJS from "exceljs";
import User from "../models/userModel.js";
import BuilderResume from "../models/builderResumeModel.js";
import {
  syncExportToUserSheet,
  applySheetSyncHeaders,
  extractSpreadsheetId,
} from "../services/userExportSheet.js";
import {
  getServiceAccountEmail,
  checkSpreadsheetAccess,
} from "../services/googleSheetsService.js";

const sheetUrlFor = (id) =>
  id ? `https://docs.google.com/spreadsheets/d/${id}` : "";

// GET /api/auth/export-sheet — the calling account's linked export spreadsheet.
export const getMyExportSheet = async (req, res, next) => {
  try {
    const account = await User.findById(req.user._id).select("exportSpreadsheetId");
    const id = account?.exportSpreadsheetId || "";
    res.status(200).json({
      spreadsheetId: id,
      spreadsheetUrl: sheetUrlFor(id),
      serviceAccountEmail: getServiceAccountEmail(),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/export-sheet  body: { spreadsheet: "<url or id>" }  ("" clears)
export const setMyExportSheet = async (req, res, next) => {
  try {
    const raw = req.body?.spreadsheet ?? req.body?.spreadsheetId ?? req.body?.url ?? "";

    if (String(raw).trim() === "") {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { exportSpreadsheetId: "" } },
      );
      res.status(200).json({ spreadsheetId: "", spreadsheetUrl: "" });
      return;
    }

    const id = extractSpreadsheetId(raw);
    if (!id) {
      res.status(400).json({
        message: "Couldn't read a Google Sheet ID from that. Paste the full sheet URL.",
      });
      return;
    }

    const access = await checkSpreadsheetAccess(id);
    if (access === "no_access") {
      res.status(400).json({
        message:
          `That sheet can't be opened. Open it → Share → add ${getServiceAccountEmail()} as Editor, then try again.`,
      });
      return;
    }
    if (access === "read_only") {
      res.status(400).json({
        message:
          `That sheet is shared as Viewer. Change ${getServiceAccountEmail()} to Editor, then try again.`,
      });
      return;
    }

    await User.updateOne(
      { _id: req.user._id },
      { $set: { exportSpreadsheetId: id } },
    );
    res.status(200).json({ spreadsheetId: id, spreadsheetUrl: sheetUrlFor(id) });
  } catch (error) {
    next(error);
  }
};

// Super-admin only. Downloads a stakeholder list as .xlsx and mirrors it into a
// tab of the super-admin's own export spreadsheet ("Admins" / "Users" /
// "Mentors" / "Super Admins").
const TYPES = {
  users: { role: "user", tab: "Users", label: "Users" },
  admins: { role: "admin", tab: "Admins", label: "Admins" },
  mentors: { role: "mentor", tab: "Mentors", label: "Mentors" },
  "super-admins": { role: "super_admin", tab: "Super Admins", label: "Super Admins" },
};

const TYPE_ALIASES = {
  user: "users",
  users: "users",
  admin: "admins",
  admins: "admins",
  mentor: "mentors",
  mentors: "mentors",
  "super-admin": "super-admins",
  "super-admins": "super-admins",
  super_admin: "super-admins",
  superadmin: "super-admins",
};

const fmtDate = (value) => (value ? new Date(value).toLocaleString() : "");

// Column set per type. Passwords are deliberately excluded — mirroring plaintext
// credentials into an external Google Sheet is a needless exposure.
// `ctx` carries per-user resume links (users export only).
const buildTable = (type, docs, ctx = {}) => {
  if (type === "users") {
    const { resolveUrl = (v) => v || "", builderByUser = new Map() } = ctx;
    return {
      headers: [
        "Name", "Email", "Phone", "Qualification",
        "Uploaded Resume", "Builder Resume", "Registered At",
      ],
      rows: docs.map((d) => {
        const built = builderByUser.get(String(d._id));
        return {
          Name: d.fullName || "",
          Email: d.email || "",
          Phone: d.whatsappNumber || d.phoneNumber || "",
          Qualification: d.latestQualification || "",
          Organization: d.organizationName || "",
          "Uploaded Resume": resolveUrl(d.resumeFilePath),
          "Builder Resume": resolveUrl(built?.fileUrl),
          "Registered At": fmtDate(d.createdAt),
        };
      }),
    };
  }

  if (type === "mentors") {
    return {
      headers: [
        "Name", "Email", "Phone", "Domain", "Years of Experience",
        "Companies Worked At", "LinkedIn", "Registered At",
      ],
      rows: docs.map((d) => ({
        Name: d.fullName || "",
        Email: d.email || "",
        Phone: d.whatsappNumber || d.phoneNumber || "",
        Domain: d.experiencedDomain || "",
        "Years of Experience": d.yearsOfExperience || "",
        "Companies Worked At": d.companiesWorkedAt || "",
        LinkedIn: d.linkedinProfile || "",
        "Registered At": fmtDate(d.createdAt),
      })),
    };
  }

  if (type === "admins") {
    return {
      headers: [
        "Name", "Email", "Phone", "Organization", "Organization Type",
        "Approval Status", "Approved At", "Registered At",
      ],
      rows: docs.map((d) => ({
        Name: d.fullName || "",
        Email: d.email || "",
        Phone: d.whatsappNumber || d.phoneNumber || "",
        Organization: d.organizationName || "",
        "Organization Type": d.organizationType || "",
        "Approval Status": d.adminApprovalStatus || "approved",
        "Approved At": fmtDate(d.adminApprovedAt),
        "Registered At": fmtDate(d.createdAt),
      })),
    };
  }

  // super-admins
  return {
    headers: ["Name", "Email", "Phone", "Registered At"],
    rows: docs.map((d) => ({
      Name: d.fullName || "",
      Email: d.email || "",
      Phone: d.whatsappNumber || d.phoneNumber || "",
      "Registered At": fmtDate(d.createdAt),
    })),
  };
};

const buildWorkbook = async (label, headers, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(label);

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9ECEF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin" } };
  });

  rows.forEach((row) => worksheet.addRow(headers.map((key) => row[key] ?? "")));

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10;
      if (length > maxLength) maxLength = length;
    });
    column.width = maxLength < 12 ? 12 : maxLength > 50 ? 50 : maxLength + 2;
  });

  return workbook.xlsx.writeBuffer();
};

// GET /api/auth/stakeholders/export?type=users|admins|mentors|super-admins
export const exportStakeholders = async (req, res, next) => {
  try {
    const requested = String(req.query.type || "").toLowerCase().trim();
    const type = TYPE_ALIASES[requested];
    const config = type && TYPES[type];

    if (!config) {
      res.status(400).json({
        message: "Invalid stakeholder type. Use users, admins, mentors or super-admins.",
      });
      return;
    }

    const docs = await User.find({ role: config.role })
      .select(
        "fullName email whatsappNumber phoneNumber organizationName organizationType " +
          "adminApprovalStatus adminApprovedAt latestQualification experiencedDomain " +
          "yearsOfExperience companiesWorkedAt linkedinProfile resumeFilePath resumeFileName createdAt",
      )
      .sort({ createdAt: -1 })
      .lean();

    // For the Users export, also pull each user's latest Resume Builder resume
    // and turn both resume paths into absolute, clickable URLs.
    const ctx = {};
    if (type === "users") {
      const origin = `${req.protocol}://${req.get("host")}`;
      ctx.resolveUrl = (p) => {
        if (!p) return "";
        if (/^https?:\/\//i.test(p)) return p;
        return `${origin}${p.startsWith("/") ? "" : "/"}${p}`;
      };

      const latestBuilt = await BuilderResume.aggregate([
        { $match: { status: "SAVED" } },
        { $sort: { finalizedAt: -1 } },
        { $group: { _id: "$userId", fileUrl: { $first: "$fileUrl" } } },
      ]);
      ctx.builderByUser = new Map(
        latestBuilt.map((r) => [String(r._id), { fileUrl: r.fileUrl || "" }]),
      );
    }

    const { headers, rows } = buildTable(type, docs, ctx);

    // "Update Google Sheet" — mirror into the super-admin's own sheet, no file.
    if (req.query.target === "sheet") {
      const sync = await syncExportToUserSheet({
        user: req.user,
        tabName: config.tab,
        headers,
        rows,
      });
      applySheetSyncHeaders(res, sync);
      res.status(200).json({ ...sync, count: rows.length });
      return;
    }

    const buffer = await buildWorkbook(config.label, headers, rows);
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${type}-${stamp}.xlsx"`);
    res.setHeader("X-Stakeholder-Count", String(rows.length));

    res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
