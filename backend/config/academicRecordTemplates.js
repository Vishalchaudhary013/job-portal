// Field templates for the repeatable Academic Journey records (spec §11-§18).
// A student's academicRecords can span Class 10, Class 12, Diploma, B.Tech,
// etc. — which recordType options are offered is filtered by the student's
// signup Qualification (see config/qualificationLevels.js).
//
// Every template shares four "common" fields (stored directly on the
// AcademicRecord document) with template-specific labels, plus a list of
// template-only `fields` (stored in the `details` map) rendered dynamically
// by the frontend form — no per-record-type form components required.

export const RECORD_TYPES = [
  "CLASS_10",
  "CLASS_12",
  "ITI",
  "DIPLOMA_POLYTECHNIC",
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "PHD",
  "OTHER",
];

const commonLabels = (institutionLabel, qualifierLabel) => ({
  institutionName: institutionLabel,
  boardOrUniversity: qualifierLabel,
});

export const ACADEMIC_RECORD_TEMPLATES = {
  CLASS_10: {
    label: "Class 10",
    commonLabels: commonLabels("School Name", "Board"),
    supportsSubjects: true,
    supportsSemesters: false,
    fields: [
      { key: "medium", label: "Medium of Instruction", type: "text" },
    ],
  },

  CLASS_12: {
    label: "Class 12",
    commonLabels: commonLabels("School Name", "Board"),
    supportsSubjects: true,
    supportsSemesters: false,
    fields: [
      {
        key: "stream",
        label: "Stream",
        type: "select",
        options: ["Science", "Commerce", "Arts"],
      },
      {
        key: "combination",
        label: "Combination",
        type: "select",
        options: ["PCM", "PCB", "PCMB"],
        showWhen: { field: "stream", equals: "Science" },
      },
      { key: "schoolLocation", label: "School Location", type: "text" },
    ],
  },

  ITI: {
    label: "ITI",
    commonLabels: commonLabels("Institute", "Affiliation"),
    supportsSubjects: false,
    supportsSemesters: false,
    fields: [
      { key: "trade", label: "Trade", type: "text", required: true },
      { key: "affiliationBody", label: "NCVT / SCVT", type: "select", options: ["NCVT", "SCVT"] },
      { key: "duration", label: "Duration", type: "text" },
      {
        key: "apprenticeshipStatus",
        label: "Apprenticeship Status",
        type: "select",
        options: ["Not Started", "In Progress", "Completed"],
      },
    ],
  },

  DIPLOMA_POLYTECHNIC: {
    label: "Polytechnic / Diploma",
    commonLabels: commonLabels("Institute", "Affiliation"),
    supportsSubjects: false,
    supportsSemesters: true,
    fields: [
      { key: "branch", label: "Branch", type: "text", required: true },
      { key: "aicteApproved", label: "AICTE Approved", type: "boolean" },
    ],
  },

  UNDERGRADUATE: {
    label: "Undergraduate",
    commonLabels: commonLabels("College", "University"),
    supportsSubjects: false,
    supportsSemesters: true,
    fields: [
      {
        key: "degree",
        label: "Degree",
        type: "select",
        options: ["BA", "BSc", "BCom", "BBA", "BCA", "B.Tech", "BE", "B.Pharm", "B.Arch", "LLB", "MBBS", "Nursing", "Other"],
        required: true,
      },
      { key: "major", label: "Major", type: "text" },
      { key: "minor", label: "Minor", type: "text" },
      { key: "currentSemester", label: "Current Semester", type: "number" },
      { key: "currentCgpa", label: "Current CGPA", type: "number" },
      { key: "creditsEarned", label: "Credits Earned", type: "number" },
      { key: "backlogs", label: "Backlogs", type: "number" },
      { key: "academicStanding", label: "Academic Standing", type: "text" },
    ],
  },

  POSTGRADUATE: {
    label: "Postgraduate",
    commonLabels: commonLabels("College", "University"),
    supportsSubjects: false,
    supportsSemesters: false,
    fields: [
      { key: "specialization", label: "Specialization", type: "text", required: true },
      { key: "semester", label: "Semester", type: "number" },
      { key: "dissertation", label: "Dissertation", type: "text" },
      { key: "researchArea", label: "Research Area", type: "text" },
      { key: "expectedGraduation", label: "Expected Graduation", type: "text" },
    ],
  },

  PHD: {
    label: "PhD",
    commonLabels: commonLabels("Department", "University"),
    supportsSubjects: false,
    supportsSemesters: false,
    fields: [
      { key: "researchArea", label: "Research Area", type: "text", required: true },
      { key: "supervisor", label: "Supervisor", type: "text" },
      { key: "coSupervisor", label: "Co-supervisor", type: "text" },
      { key: "courseworkCompleted", label: "Coursework Completed", type: "boolean" },
      { key: "synopsisSubmitted", label: "Synopsis Submitted", type: "boolean" },
      { key: "publications", label: "Publications", type: "number" },
      { key: "conferences", label: "Conferences", type: "number" },
      { key: "patents", label: "Patents", type: "number" },
      { key: "grants", label: "Grants", type: "text" },
      {
        key: "thesisStatus",
        label: "Thesis Status",
        type: "select",
        options: ["Not Started", "In Progress", "Submitted", "Approved"],
      },
      {
        key: "vivaStatus",
        label: "Viva Status",
        type: "select",
        options: ["Not Scheduled", "Scheduled", "Completed"],
      },
    ],
  },

  OTHER: {
    label: "Other Qualification",
    commonLabels: commonLabels("Institution", "Affiliation"),
    supportsSubjects: false,
    supportsSemesters: false,
    fields: [
      { key: "qualification", label: "Qualification", type: "text", required: true },
    ],
  },
};

export const isValidRecordType = (recordType) => RECORD_TYPES.includes(recordType);
