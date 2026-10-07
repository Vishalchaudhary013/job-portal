// Maps a student's signup Qualification (User.latestQualification) to which
// Student Profile wizard steps and academic-record types are relevant.
// Values not listed here (Bachelor's, Master's, Phd, or unset) see the full
// wizard and every record type. Keep in sync with the frontend mirror at
// frontend/src/features/student-profile/config/qualificationLevels.js.
import { PROFILE_STEPS } from "../models/studentProfileModel.js";

export const QUALIFICATION_OPTIONS = [
  "10th",
  "11th",
  "12th",
  "ITI",
  "Diploma",
  "Bachelor's",
  "Master's",
  "Phd",
];

const SCHOOL_HIDDEN_STEPS = ["PROJECTS", "EXPERIENCE", "RESEARCH", "CONSTRAINTS"];
const VOCATIONAL_HIDDEN_STEPS = ["RESEARCH"];

const HIDDEN_STEPS_BY_QUALIFICATION = {
  "10th": SCHOOL_HIDDEN_STEPS,
  "11th": SCHOOL_HIDDEN_STEPS,
  "12th": SCHOOL_HIDDEN_STEPS,
  ITI: VOCATIONAL_HIDDEN_STEPS,
  Diploma: VOCATIONAL_HIDDEN_STEPS,
};

export const getHiddenStepsForQualification = (qualification) =>
  HIDDEN_STEPS_BY_QUALIFICATION[qualification] || [];

export const getVisibleStepsForQualification = (qualification) => {
  const hidden = getHiddenStepsForQualification(qualification);
  return PROFILE_STEPS.filter((step) => !hidden.includes(step));
};

const RECORD_TYPES_BY_QUALIFICATION = {
  "10th": ["CLASS_10", "OTHER"],
  "11th": ["CLASS_10", "OTHER"],
  "12th": ["CLASS_10", "CLASS_12", "OTHER"],
  ITI: ["CLASS_10", "CLASS_12", "ITI", "OTHER"],
  Diploma: ["CLASS_10", "CLASS_12", "DIPLOMA_POLYTECHNIC", "OTHER"],
};

export const getAllowedRecordTypesForQualification = (qualification, allRecordTypes) =>
  RECORD_TYPES_BY_QUALIFICATION[qualification] || allRecordTypes;
