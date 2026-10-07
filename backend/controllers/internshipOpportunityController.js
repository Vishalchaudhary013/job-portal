import InternshipOpportunity from "../models/internshipOpportunityModel.js";
import xlsx from "xlsx";
import ExcelJS from "exceljs";
import Application from "../models/applicationModel.js";
import {
  syncExportToUserSheet,
  applySheetSyncHeaders,
} from "../services/userExportSheet.js";
import {
  AMOUNT_SORT_STAGE,
  buildFacetPipeline,
  buildOpportunityQuery,
  hasFilterParams,
} from "../utils/opportunityFilterQuery.js";

const OPPORTUNITY_TYPE = "Internship";

const getOwnerFilter = (req) => {
  if (req.user?.role === "super_admin") {
    return {};
  }

  return { createdBy: req.user?._id };
};

const parseSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const parseTextList = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    // Multipart submissions (e.g. a Jobs posting with a logo file) JSON-stringify array
    // fields client-side, so try that shape first before falling back to a plain
    // comma/newline separated string.
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry).trim()).filter(Boolean);
      }
    } catch {
      // not JSON — fall through to plain string splitting below
    }

    return value
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const asOptionalString = (value) => String(value || "").trim();

const parseTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch {
      // not JSON — fall through to plain comma splitting below
    }

    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeWorkMode = (workMode, location) => {
  const normalized = String(workMode || "")
    .trim()
    .toLowerCase();

  if (normalized === "remote") {
    return "Remote";
  }

  if (normalized === "hybrid") {
    return "Hybrid";
  }

  if (normalized === "in office" || normalized === "office") {
    return "In Office";
  }

  const normalizedLocation = String(location || "").toLowerCase();

  if (normalizedLocation.includes("remote")) {
    return "Remote";
  }

  if (normalizedLocation.includes("hybrid")) {
    return "Hybrid";
  }

  return "In Office";
};

const normalizeStipendDetails = (details = {}) => {
  const parsedDetails =
    typeof details === "string"
      ? (() => {
          try {
            return JSON.parse(details);
          } catch {
            return {};
          }
        })()
      : details;

  const parseAmount = (value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const min = parseAmount(parsedDetails?.min);
  const max = parseAmount(parsedDetails?.max);

  return {
    min,
    max,
    currency: String(parsedDetails?.currency || "INR").trim() || "INR",
    period: String(parsedDetails?.period || "per month").trim() || "per month",
  };
};

const parseOptionalDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveCurrencySymbol = (currency) => {
  const normalized = String(currency || "")
    .trim()
    .toUpperCase();

  if (normalized === "INR" || normalized === "RS") {
    return "₹";
  }

  // if (normalized === "USD") {
  //   return "$";
  // }

  // if (normalized === "EUR") {
  //   return "€";
  // }

  // if (normalized === "GBP") {
  //   return "£";
  // }

  return normalized ? `${normalized} ` : "₹";
};

const buildStipendLabel = (stipend, stipendDetails) => {
  const stipendText = String(stipend || "").trim();

  if (stipendText) {
    return stipendText;
  }

  const { min, max, currency, period } = stipendDetails;
  const symbol = resolveCurrencySymbol(currency);

  if (Number.isFinite(min) && Number.isFinite(max)) {
    return `${symbol}${min} - ${symbol}${max} ${period}`;
  }

  return "Not disclosed";
};

const normalizePayload = (body, logoFile) => {
  const stipendDetails = normalizeStipendDetails(body.stipendDetails);
  const logoPath = logoFile
    ? `/uploads/logos/${logoFile.filename}`
    : Object.prototype.hasOwnProperty.call(body, "logo")
      ? asOptionalString(body.logo)
      : undefined;

  return {
    ...body,
    type: ["Internship", "Jobs", "Apprenticeships"].includes(body.type) ? body.type : OPPORTUNITY_TYPE,
    skills: parseSkills(body.skills),
    cardTags: parseTags(body.cardTags),
    requiredSkills: parseTextList(body.requiredSkills),
    whoCanApply: parseTextList(body.whoCanApply),
    benefits: parseTextList(body.benefits),
    perks: parseTextList(body.perks),
    targetEducation: parseTextList(body.targetEducation),
    selectionRounds: parseTextList(body.selectionRounds),
    // Office media for the detail page's gallery — one URL per line/entry.
    cultureVideos: parseTextList(body.cultureVideos),
    officePhotos: parseTextList(body.officePhotos),
    socialProofLinks: parseJsonField(body.socialProofLinks, body.socialProofLinks),
    educationLevel: parseTextList(body.educationLevel),
    degree: parseTextList(body.degree),
    fieldOfStudy: parseTextList(body.fieldOfStudy),
    yearOfStudy: parseTextList(body.yearOfStudy),
    hiringPreference: parseTextList(body.hiringPreference),
    noticePeriod: asOptionalString(body.noticePeriod),
    relocation: asOptionalString(body.relocation),
    ppoStatus: asOptionalString(body.ppoStatus),
    department: asOptionalString(body.department),
    functionalRole: asOptionalString(body.functionalRole),
    companyType: asOptionalString(body.companyType),
    companySize: asOptionalString(body.companySize),
    foundedYear: asOptionalString(body.foundedYear),
    industry: asOptionalString(body.industry),
    listing: asOptionalString(body.listing),
    internshipType: asOptionalString(body.internshipType),
    stipendType:
      body.stipendType === "Unpaid" || body.stipendType === "Paid"
        ? body.stipendType
        : "Paid",
    website: asOptionalString(body.website),
    workMode: normalizeWorkMode(body.workMode, body.location),
    startDate: parseOptionalDate(body.startDate),
    stipendDetails,
    stipend: buildStipendLabel(body.stipend, stipendDetails),
    ...(logoPath !== undefined ? { logo: logoPath } : {}),
  };
};

// ---------------------------------------------------------------------------
// Export cell formatters.
//
// Google Sheets values are written RAW and xlsx/csv rows are flat, so every
// cell has to come out a primitive — arrays are joined, dates are made
// ISO-ish, nested objects are flattened into their own columns, and blanks are
// "" rather than null/undefined (which Sheets renders as the literal text).
// ---------------------------------------------------------------------------

const cellText = (value) => {
  if (value === null || value === undefined) return "";
  // Rich-text fields store HTML; raw markup is unreadable in a spreadsheet, so
  // tags are stripped and the text is collapsed onto one line.
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r?\n+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim()
    // Stripped block tags leave a dangling separator at either end.
    .replace(/^(\s*\|\s*)+/, "")
    .replace(/(\s*\|\s*)+$/, "")
    .trim();
};

const cellList = (value) =>
  Array.isArray(value) ? value.map((entry) => cellText(entry)).filter(Boolean).join(", ") : cellText(value);

const cellDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
};

const cellNumber = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  // A NaN would be written to the sheet as the literal text "NaN".
  return Number.isFinite(numeric) ? numeric : cellText(value);
};

const cellBool = (value) => (value ? "Yes" : "No");

// Every field the create/edit form collects, in roughly the order the form
// presents them, so a row reads top-to-bottom like the posting itself. Used
// for the CSV, the Excel workbook and the Google Sheet tab alike — they all
// go through here, so one column set keeps the three in step.
const mapRows = (opportunities, responseCounts = {}) =>
  opportunities.map((item) => ({
    // Role basics
    "Name": cellText(item.title),
    "Type": cellText(item.type),
    "Department / Category": cellText(item.departmentCategory),
    "Department": cellText(item.department),
    "Functional Role": cellText(item.functionalRole),
    "Openings": cellNumber(item.openings),
    "Location": cellText(item.location),
    "City / State": cellText(item.cityState),
    "Google Location Link": cellText(item.googleLocationLink),
    "Work Mode": cellText(item.workMode),
    "Duration": cellText(item.duration),
    "Internship Type": cellText(item.internshipType),
    "Working Hours": cellText(item.workingHours),
    "Program Type": cellText(item.programType),

    // Dates
    "Applications Open Date": cellDate(item.applicationsOpenDate),
    "Deadline": cellDate(item.deadline),
    "Selection Announcement Date": cellDate(item.selectionAnnouncementDate),
    "Start Date": cellDate(item.startDate),

    // Compensation
    "Stipend Type": cellText(item.stipendType),
    "Stipend": cellText(item.stipend),
    "Stipend Currency": cellText(item.stipendCurrency),
    "Stipend Min": cellNumber(item.stipendDetails?.min),
    "Stipend Max": cellNumber(item.stipendDetails?.max),
    "Stipend Period": cellText(item.stipendDetails?.period),
    "Incentives / Bonuses": cellText(item.incentivesBonuses),
    "Perks": cellList(item.perks),
    "Benefits": cellList(item.benefits),

    // Eligibility
    "Target Education": cellList(item.targetEducation),
    "Batch Eligibility": cellList(item.batchEligibility),
    "Education Level": cellList(item.educationLevel),
    "Degree": cellList(item.degree),
    "Field Of Study": cellList(item.fieldOfStudy),
    "Year Of Study": cellList(item.yearOfStudy),
    "Minimum CGPA": cellNumber(item.minimumCGPA),
    "Eligibility": cellText(item.eligibility),
    "Who Can Apply": cellList(item.whoCanApply),
    "Experience Level": cellText(item.experienceLevel),
    "Required Skills": cellList(item.requiredSkills),
    "Skills": cellList(item.skills),
    "Minimum Requirements": cellText(item.minimumRequirements),
    "Preferred Qualifications": cellText(item.preferredQualifications),
    "Hiring Preference": cellList(item.hiringPreference),
    "Notice Period": cellText(item.noticePeriod),
    "Relocation": cellText(item.relocation),
    "PPO Status": cellText(item.ppoStatus),

    // Description
    "About Program": cellText(item.aboutProgram),
    "Description": cellText(item.description),
    "What You Will Learn": cellText(item.whatYouWillLearn),

    // Selection process
    "Selection Rounds": cellList(item.selectionRounds),
    "Assignment Link": cellText(item.assignmentLink),
    "Custom Screening Question": cellText(item.customScreeningQuestion),

    // Company
    "Company": cellText(item.company),
    "Website": cellText(item.website),
    "Industry": cellText(item.industry),
    "Company Type": cellText(item.companyType),
    "Headquarters": cellText(item.headquarters),
    "Founded Year": cellText(item.foundedYear),
    "Company Size": cellText(item.companySize),
    "Company Classification": cellText(item.companyClassification),
    "Company Overview": cellText(item.companyOverview),
    "Specialties": cellText(item.specialties),
    "Logo": cellText(item.logo),
    "Hiring Manager": cellText(item.hiringManager),
    "Show Hiring Manager": cellBool(item.showHiringManager),
    "LinkedIn": cellText(item.socialProofLinks?.linkedin),
    "Twitter": cellText(item.socialProofLinks?.twitter),
    "Instagram": cellText(item.socialProofLinks?.instagram),
    "Office Photos": cellList(item.officePhotos),
    "Office Videos": cellList(item.cultureVideos),
    "Virtual Tour": cellText(item.virtualTour),

    // Listing meta
    "Card Tags": cellList(item.cardTags),
    "Frontend Tags": cellList(item.frontendTags),
    "Featured Listing": cellBool(item.featuredListing),
    "Responses": responseCounts[item._id.toString()] || 0,
    "Status": item.listing === "active" ? "Active" : "Closed",
    "Created At": cellDate(item.createdAt),
    "Updated At": cellDate(item.updatedAt),
  }));

const sendFile = async (res, format, rows, filename) => {
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const headerRow = worksheet.addRow(headers);

      // Bold, a step larger than the body text, white on the project navy.
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F2853' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'thin' } };
      });
      headerRow.height = 24;

      rows.forEach(rowData => {
        const row = worksheet.addRow(Object.values(rowData));
        // Set explicitly so the header still reads as bigger wherever the
        // workbook's default font size isn't what we assume.
        row.font = { size: 10 };
      });

      // Keep the header visible while scrolling a wide, long export.
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = maxLength < 12 ? 12 : maxLength > 50 ? 50 : maxLength + 2;
      });
    }

    const fileBuffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    res.status(200).send(fileBuffer);
    return;
  }

  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
  const fileBuffer = xlsx.write(workbook, { type: "buffer", bookType: "csv" });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.status(200).send(fileBuffer);
};

export const getInternships = async (req, res, next) => {
  try {
    // No filter parameters means a legacy caller (admin dashboard, the shared
    // OpportunitiesContext) that expects the full array — keep that shape.
    if (!hasFilterParams(req.query)) {
      const opportunities = await InternshipOpportunity.find({
        type: { $in: ["Internship", "Jobs", "Apprenticeships"] },
      })
        .populate({ path: "createdBy", select: "fullName email role" })
        .sort({
          createdAt: -1,
        });
      res.status(200).json(opportunities);
      return;
    }

    const { filter, sort, page, limit, skip } = buildOpportunityQuery(req.query);
    const facetMatch = { type: filter.type };

    const [data, total, facetResult] = await Promise.all([
      InternshipOpportunity.aggregate([
        { $match: filter },
        AMOUNT_SORT_STAGE,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        { $project: { _amount: 0, _hasAmount: 0 } },
      ]),
      InternshipOpportunity.countDocuments(filter),
      InternshipOpportunity.aggregate(buildFacetPipeline(facetMatch)),
    ]);

    res.status(200).json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      facets: facetResult?.[0] || {},
    });
  } catch (error) {
    next(error);
  }
};

export const getInternshipById = async (req, res, next) => {
  try {
    const opportunity = await InternshipOpportunity.findOne({
      _id: req.params.id,
      type: { $in: ["Internship", "Jobs", "Apprenticeships"] },
    }).populate({ path: "createdBy", select: "fullName email role" });

    if (!opportunity) {
      res.status(404).json({ message: "Internship opportunity not found." });
      return;
    }

    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const createInternship = async (req, res, next) => {
  try {
    const payload = {
      ...normalizePayload(req.body, req.file),
      createdBy: req.user._id,
    };
    const opportunity = await InternshipOpportunity.create(payload);
    await opportunity.populate({
      path: "createdBy",
      select: "fullName email role",
    });
    res.status(201).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const updateInternship = async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body, req.file);

    const opportunity = await InternshipOpportunity.findOneAndUpdate(
      {
        _id: req.params.id,
        type: { $in: ["Internship", "Jobs", "Apprenticeships"] },
        ...getOwnerFilter(req),
      },
      payload,
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate({ path: "createdBy", select: "fullName email role" });

    if (!opportunity) {
      res.status(404).json({ message: "Internship opportunity not found." });
      return;
    }

    res.status(200).json(opportunity);
  } catch (error) {
    next(error);
  }
};

export const deleteInternship = async (req, res, next) => {
  try {
    const opportunity = await InternshipOpportunity.findOneAndDelete({
      _id: req.params.id,
      type: { $in: ["Internship", "Jobs", "Apprenticeships"] },
      ...getOwnerFilter(req),
    });

    if (!opportunity) {
      res.status(404).json({ message: "Internship opportunity not found." });
      return;
    }

    res.status(200).json({ message: "Internship deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const exportInternships = async (req, res, next) => {
  try {
    const format = String(req.query.format || "csv").toLowerCase();
    if (format !== "csv" && format !== "xlsx") {
      res.status(400).json({ message: "Invalid format. Use csv or xlsx." });
      return;
    }

    // Internship / Jobs / Apprenticeships share this collection. `kind` (from the
    // dashboard section) narrows the export to one of them — its own Sheet tab
    // and its own file — and falls back to all three together when absent.
    const ALL_KINDS = ["Internship", "Jobs", "Apprenticeships"];
    const kind = ALL_KINDS.includes(req.query.kind) ? req.query.kind : null;

    const opportunities = await InternshipOpportunity.find({
      type: { $in: kind ? [kind] : ALL_KINDS },
      ...getOwnerFilter(req),
    }).sort({
      createdAt: -1,
    });

    const opportunityIds = opportunities.map(o => o._id);
    const counts = await Application.aggregate([
      { $match: { opportunity: { $in: opportunityIds } } },
      { $group: { _id: "$opportunity", count: { $sum: 1 } } }
    ]);

    const responseCounts = {};
    counts.forEach(c => {
      responseCounts[c._id.toString()] = c.count;
    });

    const rows = mapRows(opportunities, responseCounts);
    const TAB_LABEL = { Internship: "Internships", Jobs: "Jobs", Apprenticeships: "Apprenticeships" };
    const tabName = kind ? TAB_LABEL[kind] : "Internships & Jobs";
    const fileBase = kind ? kind.toLowerCase() : "internships";

    if (req.query.target === "sheet") {
      const sheetSync = await syncExportToUserSheet({
        user: req.user,
        tabName,
        rows,
      });
      applySheetSyncHeaders(res, sheetSync);
      res.status(200).json(sheetSync);
      return;
    }

    await sendFile(res, format, rows, fileBase);
  } catch (error) {
    next(error);
  }
};

/**
 * Stores files picked from the admin's machine for the Office Photos / Videos
 * fields and hands back their public paths. The form keeps those fields as a
 * list of URLs either way, so an upload just appends more URLs — pasted links
 * and uploaded files stay interchangeable.
 */
export const uploadOfficeMedia = async (req, res, next) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      res.status(400).json({ message: "No files were uploaded." });
      return;
    }

    // Relative paths, like logos: the frontend prefixes API_BASE_URL, so the
    // same record works across environments without a stored hostname.
    const urls = files.map((file) => `/uploads/office-media/${file.filename}`);

    res.status(201).json({ urls });
  } catch (error) {
    next(error);
  }
};

export const attachForm = async (req, res, next) => {
  try {
    const { formId } = req.body;
    const internshipId = req.params.id;

    const internship = await InternshipOpportunity.findOneAndUpdate(
      { _id: internshipId, ...getOwnerFilter(req) },
      { formId },
      { returnDocument: "after" }
    );

    if (!internship) {
      res.status(404).json({ message: "Internship not found or unauthorized" });
      return;
    }

    res.status(200).json({ 
      message: "Form attached successfully", 
      internship 
    });
  } catch (error) {
    next(error);
  }
};
