// Translates listing-page query parameters into a MongoDB filter, sort and
// pagination window for the opportunities collection (Jobs, Internships and
// Apprenticeships all live in it, distinguished by `type`).
//
// Kept as pure functions with no Mongoose imports so the parsing rules can be
// unit-tested without a database connection.

const LISTING_TYPES = ["Internship", "Jobs", "Apprenticeships"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Values are authored by admins with inconsistent casing ("Full-time" vs
// "full time"), so categorical matches are anchored case-insensitive regexes.
// $in over a regex array also matches array fields element-wise.
const exactAny = (values) => ({ $in: values.map((value) => new RegExp(`^${escapeRegex(value)}$`, "i")) });

const containsAny = (values) => ({ $in: values.map((value) => new RegExp(escapeRegex(value), "i")) });

export const parseList = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => String(entry).split(",")).map((entry) => entry.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
};

const parseNumber = (value) => {
  const cleaned = String(value ?? "").replace(/[^\d.-]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const daysFromNow = (days) => new Date(Date.now() + days * 86400000);
const daysAgo = (days) => new Date(Date.now() - days * 86400000);

const DATE_POSTED_WINDOWS = { "24h": 1, "3d": 3, "7d": 7, "30d": 30 };
const DEADLINE_WINDOWS = { today: 0, "3d": 3, "7d": 7, "30d": 30 };
const START_DATE_WINDOWS = { immediately: 14, "1month": 30, "3months": 90 };

// Each key maps a query parameter to the document field(s) it narrows.
// `csv` entries accept comma-separated multi-select values.
const CSV_FIELD_MAP = {
  workMode: "workMode",
  jobType: "jobType",
  internshipType: "workingHours",
  workingHours: "workingHours",
  experience: "experienceLevel",
  experienceRequired: "experienceLevel",
  role: "functionalRole",
  department: "departmentCategory",
  industry: "industry",
  companySize: "companySize",
  companyType: "companyType",
  educationLevel: "educationLevel",
  degree: "degree",
  fieldOfStudy: "fieldOfStudy",
  yearOfStudy: "yearOfStudy",
  graduationYear: "batchEligibility",
  hiringPreference: "hiringPreference",
  noticePeriod: "noticePeriod",
  relocation: "relocation",
  ppo: "ppoStatus",
  stipendType: "stipendType",
  benefits: "benefits",
  perks: "perks",
};

export const FILTER_PARAM_KEYS = [
  ...Object.keys(CSV_FIELD_MAP),
  "type",
  "keyword",
  "location",
  "skills",
  "duration",
  "paid",
  "salaryMin",
  "salaryMax",
  "stipendMin",
  "stipendMax",
  "datePosted",
  "deadline",
  "startDate",
  "sort",
  "page",
  "limit",
];

export const hasFilterParams = (query = {}) =>
  FILTER_PARAM_KEYS.some((key) => {
    const value = query[key];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

// Amount sorts run against the `_amount` / `_hasAmount` fields that
// AMOUNT_SORT_STAGE adds. Leading with `_hasAmount: -1` keeps listings that
// never stated a figure at the bottom in both directions, instead of letting
// "low to high" open with a page of blanks.
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  salary_desc: { _hasAmount: -1, _amount: -1, createdAt: -1 },
  salary_asc: { _hasAmount: -1, _amount: 1, createdAt: -1 },
  stipend_desc: { _hasAmount: -1, _amount: -1, createdAt: -1 },
  stipend_asc: { _hasAmount: -1, _amount: 1, createdAt: -1 },
  deadline: { deadline: 1 },
  relevance: { featuredListing: -1, createdAt: -1 },
};

export const AMOUNT_SORT_STAGE = {
  $addFields: {
    _amount: { $ifNull: ["$stipendDetails.max", "$stipendDetails.min"] },
    _hasAmount: { $cond: [{ $gt: [{ $ifNull: ["$stipendDetails.max", "$stipendDetails.min"] }, 0] }, 1, 0] },
  },
};

export const buildOpportunityQuery = (query = {}) => {
  const filter = {};
  const and = [];

  const requestedType = String(query.type || "").trim();
  filter.type = LISTING_TYPES.includes(requestedType) ? requestedType : { $in: LISTING_TYPES };

  const keyword = String(query.keyword || "").trim();
  if (keyword) {
    const pattern = new RegExp(escapeRegex(keyword), "i");
    and.push({
      $or: [
        { title: pattern },
        { company: pattern },
        { description: pattern },
        { skills: pattern },
        { functionalRole: pattern },
      ],
    });
  }

  const location = String(query.location || "").trim();
  if (location) {
    const pattern = new RegExp(escapeRegex(location), "i");
    and.push({ $or: [{ location: pattern }, { cityState: pattern }, { headquarters: pattern }] });
  }

  Object.entries(CSV_FIELD_MAP).forEach(([param, field]) => {
    const values = parseList(query[param]);
    if (values.length) filter[field] = exactAny(values);
  });

  const skills = parseList(query.skills);
  if (skills.length) {
    and.push({ $or: [{ skills: exactAny(skills) }, { requiredSkills: exactAny(skills) }] });
  }

  // Durations are free text ("3 months", "3-6 months"), so match the month
  // count as a standalone number to keep "1" from matching "12 months".
  const durations = parseList(query.duration);
  if (durations.length) {
    const patterns = durations
      .map((value) => parseNumber(value))
      .filter((value) => value !== null)
      .map((months) => new RegExp(`(^|[^0-9])${months}([^0-9]|$)`));
    if (patterns.length) and.push({ duration: { $in: patterns } });
  }

  const paid = String(query.paid || "").trim().toLowerCase();
  if (paid === "paid") filter.stipendType = { $not: /^unpaid$/i };
  if (paid === "unpaid") filter.stipendType = /^unpaid$/i;

  // Salary and stipend are the same underlying field; the two parameter names
  // just mirror the wording each listing page uses.
  const minAmount = parseNumber(query.salaryMin ?? query.stipendMin);
  const maxAmount = parseNumber(query.salaryMax ?? query.stipendMax);
  if (minAmount !== null || maxAmount !== null) {
    const range = {};
    if (minAmount !== null) range.$gte = minAmount;
    if (maxAmount !== null) range.$lte = maxAmount;
    and.push({ $or: [{ "stipendDetails.max": range }, { "stipendDetails.min": range }] });
  }

  const datePosted = String(query.datePosted || "").trim().toLowerCase();
  if (DATE_POSTED_WINDOWS[datePosted]) {
    filter.createdAt = { $gte: daysAgo(DATE_POSTED_WINDOWS[datePosted]) };
  }

  const deadlineWindow = String(query.deadline || "").trim().toLowerCase();
  if (deadlineWindow in DEADLINE_WINDOWS) {
    filter.deadline = { $gte: new Date(), $lte: daysFromNow(DEADLINE_WINDOWS[deadlineWindow] || 1) };
  }

  const startDate = String(query.startDate || "").trim().toLowerCase();
  if (START_DATE_WINDOWS[startDate]) {
    filter.startDate = { $gte: new Date(), $lte: daysFromNow(START_DATE_WINDOWS[startDate]) };
  }

  if (and.length) filter.$and = and;

  const sort = SORT_OPTIONS[String(query.sort || "").trim()] || SORT_OPTIONS.relevance;

  const page = Math.max(1, parseNumber(query.page) || 1);
  const requestedLimit = parseNumber(query.limit) || 12;
  const limit = Math.min(60, Math.max(1, requestedLimit));

  return { filter, sort, page, limit, skip: (page - 1) * limit };
};

// Facet counts power the option lists in the sidebar. They are computed over
// the type-scoped set rather than the fully filtered one so that selecting a
// value doesn't make the other options in its own group disappear.
export const FACET_FIELDS = {
  workMode: "$workMode",
  workingHours: "$workingHours",
  jobType: "$jobType",
  experienceLevel: "$experienceLevel",
  functionalRole: "$functionalRole",
  department: "$departmentCategory",
  industry: "$industry",
  companyType: "$companyType",
  companySize: "$companySize",
  stipendType: "$stipendType",
  location: "$location",
  skills: "$skills",
  educationLevel: "$educationLevel",
  degree: "$degree",
  fieldOfStudy: "$fieldOfStudy",
  yearOfStudy: "$yearOfStudy",
  graduationYear: "$batchEligibility",
  hiringPreference: "$hiringPreference",
  noticePeriod: "$noticePeriod",
  relocation: "$relocation",
  ppoStatus: "$ppoStatus",
  benefits: "$benefits",
  perks: "$perks",
  duration: "$duration",
};

export const buildFacetPipeline = (matchStage) => [
  { $match: matchStage },
  {
    $facet: Object.fromEntries(
      Object.entries(FACET_FIELDS).map(([key, path]) => [
        key,
        [
          { $unwind: { path, preserveNullAndEmptyArrays: false } },
          { $group: { _id: path, count: { $sum: 1 } } },
          { $match: { _id: { $nin: [null, ""] } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 25 },
          { $project: { _id: 0, value: "$_id", count: 1 } },
        ],
      ]),
    ),
  },
];
