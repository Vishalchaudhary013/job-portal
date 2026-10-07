// Pushes a Resume Builder resume back into the student's Edeco profile when the
// student opts in at finalize time ("Also update my Edeco profile").
//
// Strictly non-destructive, exactly like the resume-autofill path: scalar
// personal/contact fields fill blanks only, repeatable sections are appended and
// deduped, never replaced. Reuses applyResumeDataToProfile (resumeProfileMapper.js)
// for everything except education, which becomes AcademicRecord documents the
// same way resumeController.applyResume creates them.

import AcademicRecord from "../models/academicRecordModel.js";
import { PROFILE_STEPS } from "../models/studentProfileModel.js";
import { getOrCreateStudentProfile } from "../controllers/studentProfileController.js";
import { applyResumeDataToProfile } from "./resumeProfileMapper.js";
import { computeStudentProfileCompletion } from "../utils/studentProfileCompletion.js";
import { isValidRecordType } from "../config/academicRecordTemplates.js";

const str = (value) => String(value ?? "").trim();
const normKey = (value) => str(value).toLowerCase();

// Fill a scalar only when the profile doesn't already have one — the builder
// merge accelerates, it never overwrites what the student entered elsewhere.
const fillBlank = (target, key, value) => {
  if (value && !str(target[key])) target[key] = str(value);
};

const socialProfilesFrom = (personal = {}) =>
  [
    ["LinkedIn", personal.linkedin],
    ["GitHub", personal.github],
    ["Portfolio", personal.portfolio],
  ]
    .filter(([, url]) => str(url))
    .map(([platform, url]) => ({ platform, url: str(url), username: "" }));

// Best-effort recordType inference. Entries that can't be typed cleanly are
// skipped rather than guessed.
const UG_DEGREE_RE = /\b(b\.?\s?tech|b\.?e\.?|b\.?sc|b\.?a\b|b\.?com|b\.?b\.?a|b\.?c\.?a|b\.?pharm|b\.?arch|ll\.?b|mbbs|bachelor|undergrad)/i;
const PG_DEGREE_RE = /\b(m\.?\s?tech|m\.?e\.?|m\.?sc|m\.?a\b|m\.?com|m\.?b\.?a|m\.?c\.?a|m\.?pharm|ll\.?m|master|postgrad|pg\b)/i;
const PHD_RE = /\b(ph\.?\s?d|doctor(al|ate))/i;
const DIPLOMA_RE = /\b(diploma|polytechnic)/i;

const inferRecordType = (entry) => {
  const cls = normKey(entry.class);
  if (cls.includes("10")) return "CLASS_10";
  if (cls.includes("12")) return "CLASS_12";
  if (str(entry.trade)) return "ITI";

  const degree = str(entry.degree);
  if (!degree) return null;
  if (PHD_RE.test(degree)) return "PHD";
  if (DIPLOMA_RE.test(degree)) return "DIPLOMA_POLYTECHNIC";
  if (PG_DEGREE_RE.test(degree)) return "POSTGRADUATE";
  if (UG_DEGREE_RE.test(degree)) return "UNDERGRADUATE";
  return null;
};

const toYear = (value) => {
  const year = parseInt(str(value), 10);
  return Number.isFinite(year) && year > 1900 && year < 2200 ? year : null;
};

const buildAcademicRecordDetails = (entry, recordType) => {
  const details = {};
  if (recordType === "CLASS_12" && str(entry.stream)) details.stream = str(entry.stream);
  if (recordType === "ITI") {
    if (str(entry.trade)) details.trade = str(entry.trade);
    if (str(entry.affiliation)) details.affiliationBody = str(entry.affiliation);
    if (str(entry.duration)) details.duration = str(entry.duration);
  }
  if (recordType === "DIPLOMA_POLYTECHNIC" && str(entry.branch)) details.branch = str(entry.branch);
  if (recordType === "UNDERGRADUATE") {
    if (str(entry.degree)) details.degree = str(entry.degree);
    if (str(entry.branch)) details.major = str(entry.branch);
  }
  if (recordType === "POSTGRADUATE" && str(entry.branch)) details.specialization = str(entry.branch);
  if (recordType === "PHD" && str(entry.branch)) details.researchArea = str(entry.branch);
  return details;
};

/**
 * @param {import("mongoose").Types.ObjectId|string} userId
 * @param {object} resumeData  The builder resumeData JSON.
 * @returns {Promise<import("mongoose").Document>} the updated StudentProfile
 */
export const syncBuilderResumeToProfile = async (userId, resumeData) => {
  const data = resumeData || {};
  const profile = await getOrCreateStudentProfile(userId);
  const personal = data.personal || {};

  // Personal/contact scalars: blank-fill only (never overwrite).
  fillBlank(profile.personalInformation, "fullName", personal.fullName);
  fillBlank(profile.contactInformation, "email", personal.email);
  fillBlank(profile.contactInformation, "mobileNumber", personal.phone);

  const payload = {
    // Handled above — keep applyResumeDataToProfile away from these scalars.
    socialProfiles: socialProfilesFrom(personal),
    skills: (data.skills || [])
      .map((skill) => str(skill))
      .filter(Boolean)
      .map((skill) => ({ skill, category: "", proficiency: "", yearsOfExperience: null })),
    experiences: (data.experience || [])
      .filter((item) => str(item?.role) || str(item?.company))
      .map((item) => ({
        company: str(item.company),
        role: str(item.role),
        employmentType: "",
        location: str(item.location),
        startDate: null,
        endDate: null,
        isCurrent: Boolean(item.current),
        description: str(item.description),
        skillsUsed: "",
      })),
    projects: (data.projects || [])
      .filter((item) => str(item?.name))
      .map((item) => ({
        name: str(item.name),
        description: str(item.description),
        role: "",
        technologies: str(item.techStack),
        startDate: null,
        endDate: null,
        projectType: "",
        githubUrl: str(item.githubLink),
        liveUrl: str(item.liveLink),
      })),
    certifications: (data.certifications || [])
      .filter((item) => str(item?.name))
      .map((item) => ({
        name: str(item.name),
        issuingOrganization: str(item.issuer),
        issueDate: null,
        expiryDate: null,
        credentialId: "",
        credentialUrl: str(item.credentialUrl),
      })),
    achievements: (data.achievements || [])
      .map((item) => str(item))
      .filter(Boolean)
      .map((title) => ({ title, category: "", organization: "", position: "", date: null, description: "" })),
  };

  applyResumeDataToProfile(profile, payload);

  // Career: only fill the desired job role when it's currently blank.
  const title = str(data.personal?.title);
  if (title && !str(profile.careerPreferences?.desiredJobRole)) {
    profile.careerPreferences.desiredJobRole = title;
  }

  // Education -> AcademicRecord docs (dedupe on institution + recordType).
  const existing = await AcademicRecord.find({ studentProfileId: profile._id }).select("institutionName recordType").lean();
  const seen = new Set(existing.map((r) => `${normKey(r.institutionName)}|${r.recordType}`));
  const newRecords = [];
  (data.education || []).forEach((entry) => {
    const recordType = inferRecordType(entry || {});
    if (!recordType || !isValidRecordType(recordType)) return;
    const key = `${normKey(entry.institute)}|${recordType}`;
    if (seen.has(key)) return;
    seen.add(key);
    newRecords.push({
      userId,
      studentProfileId: profile._id,
      recordType,
      institutionName: str(entry.institute),
      boardOrUniversity: str(entry.board),
      passingYear: toYear(entry.endYear),
      isCurrent: false,
      percentage: null,
      cgpa: null,
      details: buildAcademicRecordDetails(entry, recordType),
    });
  });

  if (newRecords.length > 0) {
    await AcademicRecord.insertMany(newRecords);
    profile.academicRecordsCount = await AcademicRecord.countDocuments({ studentProfileId: profile._id });
  }

  const { status, sections } = computeStudentProfileCompletion(profile);
  profile.profileStatus = status;
  if (status === "COMPLETE" && !profile.completedAt) {
    profile.completedAt = new Date();
  }
  const firstIncomplete = PROFILE_STEPS.find((step) => step !== "REVIEW" && !sections[step]?.complete);
  profile.currentStep = firstIncomplete || "REVIEW";

  await profile.save();
  return profile;
};
