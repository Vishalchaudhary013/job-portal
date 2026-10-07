// Weighted completion engine for the Student Profile setup wizard.
// Each section contributes its listed weight only when implemented; sections
// without a real data model/UI yet (everything past PERSONAL, for now) always
// score 0 so profileCompletion reflects real data, never a hardcoded number.
import { getHiddenStepsForQualification } from "../config/qualificationLevels.js";

export const SECTION_WEIGHTS = {
  PERSONAL: 15,
  ACADEMIC: 25,
  SKILLS: 10,
  PROJECTS: 10,
  EXPERIENCE: 10,
  RESEARCH: 5,
  ACHIEVEMENTS: 5,
  PREFERENCES: 5,
  CAREER: 5,
  CONSTRAINTS: 5,
  SOCIAL: 5,
};

// Sections that must be fully complete before profileStatus can become
// COMPLETE (Skills/Projects/etc. are "recommended", not blocking, per spec).
export const REQUIRED_SECTIONS = ["PERSONAL", "ACADEMIC"];

const REQUIRED_PERSONAL_FIELDS = [
  (p) => p.personalInformation?.fullName,
  (p) => p.personalInformation?.gender,
  (p) => p.personalInformation?.dateOfBirth,
  (p) => p.contactInformation?.mobileNumber,
  (p) => p.contactInformation?.email,
  (p) => p.currentAddress?.line1,
  (p) => p.currentAddress?.city,
  (p) => p.currentAddress?.state,
  (p) => p.currentAddress?.pinCode,
];

const personalScore = (profile) => {
  const filled = REQUIRED_PERSONAL_FIELDS.filter((getField) => Boolean(getField(profile))).length;
  return filled / REQUIRED_PERSONAL_FIELDS.length;
};

// At least one academic record is required, not an exhaustive history
// (spec §47 — Academic Journey is "required", the count of records is not).
const academicScore = (profile) => (profile.academicRecordsCount > 0 ? 1 : 0);

// Recommended/optional sections (spec §47) — scored on presence of any real
// data, never blocking `profileStatus` from reaching COMPLETE (see
// REQUIRED_SECTIONS above).
const skillsScore = (profile) =>
  (profile.skills?.length > 0 || profile.certifications?.length > 0) ? 1 : 0;
const projectsScore = (profile) => (profile.projects?.length > 0 ? 1 : 0);
const experienceScore = (profile) => (profile.experiences?.length > 0 ? 1 : 0);
const researchScore = (profile) => (profile.publications?.length > 0 ? 1 : 0);
const achievementsScore = (profile) => (profile.achievements?.length > 0 ? 1 : 0);
const preferencesScore = (profile) =>
  (profile.preferences?.interests?.length > 0 && profile.preferences?.preferredLocation) ? 1 : 0;
const careerScore = (profile) =>
  (profile.careerPreferences?.desiredCareer && profile.careerPreferences?.workPreference) ? 1 : 0;
const constraintsScore = (profile) =>
  (profile.practicalConstraints?.workingStatus && profile.practicalConstraints?.learningMode) ? 1 : 0;
const socialScore = (profile) => (profile.socialProfiles?.length > 0 ? 1 : 0);

const SECTION_SCORERS = {
  PERSONAL: personalScore,
  ACADEMIC: academicScore,
  SKILLS: skillsScore,
  PROJECTS: projectsScore,
  EXPERIENCE: experienceScore,
  RESEARCH: researchScore,
  ACHIEVEMENTS: achievementsScore,
  PREFERENCES: preferencesScore,
  CAREER: careerScore,
  CONSTRAINTS: constraintsScore,
  SOCIAL: socialScore,
};

// `qualification` (User.latestQualification) drops sections that don't apply
// to that student (e.g. Research for a 10th grader) out of the weighted
// total, so completion can still reach 100% without asking for irrelevant
// data — see config/qualificationLevels.js.
export const computeStudentProfileCompletion = (profile, qualification) => {
  const hiddenSteps = getHiddenStepsForQualification(qualification);
  const applicableSectionIds = Object.keys(SECTION_WEIGHTS).filter((id) => !hiddenSteps.includes(id));
  const applicableWeightTotal = applicableSectionIds.reduce((sum, id) => sum + SECTION_WEIGHTS[id], 0);

  const sections = {};
  let totalScore = 0;

  applicableSectionIds.forEach((sectionId) => {
    const weight = SECTION_WEIGHTS[sectionId];
    const score = SECTION_SCORERS[sectionId](profile);
    const complete = score >= 1;
    sections[sectionId] = { weight, score, complete };
    totalScore += weight * score;
  });

  const completion = applicableWeightTotal > 0 ? Math.round((totalScore / applicableWeightTotal) * 100) : 0;
  const requiredSectionsComplete = REQUIRED_SECTIONS.every((id) => sections[id]?.complete);
  const anyProgress = Object.values(sections).some((s) => s.score > 0);

  let status = "NOT_STARTED";
  if (requiredSectionsComplete) {
    status = "COMPLETE";
  } else if (anyProgress) {
    status = "IN_PROGRESS";
  }

  return { completion, status, sections };
};
