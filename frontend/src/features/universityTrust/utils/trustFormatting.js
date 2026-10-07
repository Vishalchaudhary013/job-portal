// Mirrors backend/models/universityEvidenceModel.js's enums — frontend and backend are
// separate deployables with no shared package, so these are kept in sync by hand, same as
// UniversityPortfolioForm.jsx already does with RECOGNITION_OPTIONS/NAAC_GRADE_OPTIONS.
export const EVIDENCE_CRITERIA = [
  "regulatoryRecognition",
  "accreditation",
  "academicReputation",
  "faculty",
  "studentSupport",
  "lms",
  "examinationSystem",
  "careerServices",
  "transparency",
];

export const EVIDENCE_STATUSES = [
  "verified",
  "partiallyVerified",
  "notVerified",
  "notApplicable",
  "expired",
  "conflicting",
  "insufficientEvidence",
];

export const EVIDENCE_SOURCE_TYPES = [
  "officialRegulatory",
  "officialAccreditation",
  "officialUniversity",
  "government",
  "institutionalDocument",
  "verifiedStudentReview",
  "platformVerification",
  "other",
];

export const EVIDENCE_SOURCE_TYPE_LABELS = {
  officialRegulatory: "Official Regulatory Source",
  officialAccreditation: "Official Accreditation Source",
  officialUniversity: "Official University Source",
  government: "Government Source",
  institutionalDocument: "Institutional Document",
  verifiedStudentReview: "Verified Student Review",
  platformVerification: "Platform Verification",
  other: "Other Approved Source",
};

export const formatMonthYear = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;

export const EVIDENCE_STATUS_LABELS = {
  verified: "Verified",
  partiallyVerified: "Partially Verified",
  notVerified: "Not Verified",
  notApplicable: "Not Applicable",
  expired: "Expired",
  conflicting: "Conflicting",
  insufficientEvidence: "Insufficient Evidence",
};

export const TRUST_LEVEL_STYLES = {
  "High Trust": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good Trust": "bg-blue-50 text-blue-700 border-blue-200",
  "Moderate Trust": "bg-amber-50 text-amber-700 border-amber-200",
  "Low Trust": "bg-slate-100 text-slate-600 border-slate-200",
};

export const CONFIDENCE_STYLES = {
  High: "bg-emerald-50 text-emerald-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export const EVIDENCE_STATUS_STYLES = {
  verified: "bg-emerald-50 text-emerald-700",
  partiallyVerified: "bg-blue-50 text-blue-700",
  notApplicable: "bg-slate-100 text-slate-600",
  notVerified: "bg-slate-100 text-slate-500",
  expired: "bg-amber-50 text-amber-700",
  conflicting: "bg-red-50 text-red-700",
  insufficientEvidence: "bg-slate-100 text-slate-500",
};
