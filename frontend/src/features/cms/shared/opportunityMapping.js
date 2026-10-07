// GENERATED from backend/cms/shared — do not edit here. Run `npm run sync:cms-shared` in backend/.
import { referenceableFields } from "./schemaUtils.js";

// Maps a Form Builder entry onto Edeco's own job / internship / apprenticeship
// record, so the entry is shown by Edeco's existing pages (homepage cards,
// /jobs listing with its filters, the job detail page, Apply) exactly like an
// opportunity created in the admin dashboard.
//
// Which form field fills which slot is chosen by the admin in the content
// type's Presentation settings ("Show on Edeco job pages") — nothing here
// assumes a particular form. Used by the server sync and by the preview, so
// both produce the same record.

export const EDECO_LISTING_TARGETS = [
  { id: "Jobs", label: "Jobs" },
  { id: "Internship", label: "Internships" },
  { id: "Apprenticeships", label: "Apprenticeships" },
];

const TEXT = ["text", "textarea", "select", "radio", "email", "number"];
const LONG = ["richText", "textarea", "text"];
const LIST = ["textarea", "text", "multiSelect", "checkbox", "repeater", "table", "select", "radio"];

export const EDECO_LISTING_SLOTS = [
  { id: "title", label: "Title", required: true, accepts: TEXT, hints: ["title", "role", "position", "name"] },
  { id: "company", label: "Company", required: true, accepts: TEXT, hints: ["company", "employer", "organisation", "organization"] },
  { id: "logo", label: "Company logo", accepts: ["image"], hints: ["logo"] },
  { id: "jobType", label: "Job type", accepts: ["select", "radio", "text"], hints: ["jobtype", "type", "employment"] },
  { id: "workMode", label: "Work mode", accepts: ["select", "radio", "text"], hints: ["workmode", "mode", "remote"] },
  { id: "location", label: "Location", accepts: ["text", "select"], hints: ["location", "city", "venue"] },
  { id: "experience", label: "Experience", accepts: ["select", "radio", "text"], hints: ["experience", "level"] },
  { id: "salary", label: "Salary / stipend", accepts: ["text", "number"], hints: ["salary", "stipend", "ctc", "pay"] },
  { id: "openings", label: "Openings", accepts: ["number"], hints: ["opening", "vacanc", "seats"] },
  { id: "deadline", label: "Apply by (deadline)", required: true, accepts: ["date", "datetime"], hints: ["deadline", "applyby", "lastdate"] },
  { id: "category", label: "Category (detail page chip)", accepts: ["select", "radio", "text"], hints: ["category", "department"] },
  { id: "skills", label: "Skills", accepts: LIST, hints: ["skill"] },
  { id: "aboutRole", label: "About the role", accepts: LONG, hints: ["about", "description", "overview"] },
  { id: "responsibilities", label: "Key responsibilities", accepts: LONG, hints: ["responsib", "duties"] },
  { id: "requirements", label: "Minimum requirements", accepts: LONG, hints: ["requirement", "eligib"] },
  { id: "preferred", label: "Preferred qualifications", accepts: LONG, hints: ["preferred", "qualification"] },
  { id: "learn", label: "What you will learn", accepts: LONG, hints: ["learn", "outcome"] },
  { id: "benefits", label: "Perks / benefits", accepts: LIST, hints: ["benefit", "perk"] },
  { id: "interviewProcess", label: "Interview process", accepts: ["textarea", "repeater", "table", "text"], hints: ["interview", "round", "process"] },
  { id: "industry", label: "Industry", accepts: TEXT, hints: ["industry", "sector"] },
  { id: "companyOverview", label: "About the company", accepts: LONG, hints: ["companyoverview", "aboutcompany"] },
  { id: "website", label: "Company website", accepts: ["url", "text"], hints: ["website", "site"] },
  { id: "featured", label: "Featured", accepts: ["checkbox"], hints: ["featured"] },
];

// Suggests a mapping from field keys/labels (the admin can change any of it).
export const suggestListingMapping = (fields = []) => {
  const refs = referenceableFields(fields);
  const used = new Set();
  const mapping = {};
  EDECO_LISTING_SLOTS.forEach((slot) => {
    const match = refs.find((ref) => {
      if (used.has(ref.id) || !slot.accepts.includes(ref.type)) return false;
      const hay = `${ref.key} ${ref.label}`.toLowerCase().replace(/[^a-z]/g, "");
      return slot.hints.some((hint) => hay.includes(hint));
    });
    if (match) {
      mapping[slot.id] = match.id;
      used.add(match.id);
    }
  });
  return mapping;
};

const readPath = (data, path) => path.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), data);
const labelFor = (field, value) => field?.options?.find((option) => String(option.value) === String(value))?.label ?? String(value);
const stripTags = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const asText = (ref, value) => {
  if (value === undefined || value === null || value === "") return "";
  if (["select", "radio"].includes(ref.type)) return labelFor(ref.field, value);
  if (Array.isArray(value)) return value.map((item) => labelFor(ref.field, item)).join(", ");
  if (ref.type === "richText") return stripTags(value);
  if (typeof value === "object") return value.url || "";
  return String(value);
};

const asList = (ref, value) => {
  if (value === undefined || value === null || value === "") return [];
  if (ref.type === "repeater" && Array.isArray(value)) {
    const first = (ref.field.children || []).find((child) => child.key);
    return first ? value.map((item) => asText({ type: first.type, field: first }, item?.[first.key])).filter(Boolean) : [];
  }
  if (ref.type === "table" && Array.isArray(value)) {
    const columns = (ref.field.columns || []).map((column) => column.key);
    return value.map((row) => columns.map((key) => row?.[key]).filter(Boolean).join(" — ")).filter(Boolean);
  }
  if (Array.isArray(value)) return value.map((item) => labelFor(ref.field, item)).filter(Boolean);
  if (typeof value === "boolean") return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

// Rich text stays HTML (Edeco's detail page renders it); textarea stays
// newline text (rendered as a bullet list there).
const asLong = (ref, value) => (value === undefined || value === null ? "" : ref.type === "richText" ? String(value) : asText(ref, value));

const WORK_MODES = [
  [/remote/i, "Remote"],
  [/hybrid/i, "Hybrid"],
  [/on[\s-]?site/i, "On-site"],
  [/office/i, "In Office"],
];

export const mapEntryToOpportunity = ({ fields = [], data = {}, mapping = {}, target }) => {
  const refs = new Map(referenceableFields(fields).map((ref) => [ref.id, ref]));
  const slot = (id) => {
    const ref = refs.get(mapping[id]);
    return ref ? { ref, value: readPath(data, ref.path) } : null;
  };
  const text = (id) => (slot(id) ? asText(slot(id).ref, slot(id).value) : "");
  const long = (id) => (slot(id) ? asLong(slot(id).ref, slot(id).value) : "");
  const list = (id) => (slot(id) ? asList(slot(id).ref, slot(id).value) : []);

  const jobType = text("jobType");
  const workModeText = text("workMode");
  const workMode = WORK_MODES.find(([pattern]) => pattern.test(workModeText))?.[1];
  const location = text("location");
  const logoValue = slot("logo")?.value;
  const logo = Array.isArray(logoValue) ? logoValue[0]?.url || "" : logoValue?.url || "";
  const deadlineValue = slot("deadline")?.value;
  const openings = Number(slot("openings")?.value);
  const skills = list("skills");
  const benefits = list("benefits");
  const aboutRole = long("aboutRole");
  const responsibilities = long("responsibilities");

  return {
    type: target,
    title: text("title"),
    company: text("company"),
    logo,
    jobType,
    internshipType: jobType,
    ...(/^(full|part)-time$/i.test(jobType) ? { workingHours: jobType.charAt(0).toUpperCase() + jobType.slice(1).toLowerCase() } : {}),
    ...(workMode ? { workMode } : {}),
    location,
    cityState: location,
    experienceLevel: text("experience"),
    stipend: text("salary"),
    openings: Number.isFinite(openings) ? openings : null,
    deadline: deadlineValue ? new Date(deadlineValue).toISOString() : null,
    departmentCategory: text("category"),
    skills,
    requiredSkills: skills,
    aboutProgram: aboutRole,
    // Edeco requires a description; fall back to the role text, then the title.
    description: responsibilities || aboutRole || text("title"),
    minimumRequirements: long("requirements"),
    preferredQualifications: long("preferred"),
    whatYouWillLearn: long("learn"),
    perks: benefits,
    benefits,
    selectionRounds: list("interviewProcess"),
    industry: text("industry"),
    companyOverview: long("companyOverview"),
    website: text("website"),
    featuredListing: slot("featured")?.value === true,
  };
};

// What's missing before an entry can be listed on Edeco.
export const missingListingFields = (opportunity) =>
  [
    !opportunity.title && "Title",
    !opportunity.company && "Company",
  ].filter(Boolean);
