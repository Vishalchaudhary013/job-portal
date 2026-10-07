import StudentProfile, { PROFILE_STEPS } from "../models/studentProfileModel.js";
import { computeStudentProfileCompletion, REQUIRED_SECTIONS } from "../utils/studentProfileCompletion.js";
import { encrypt } from "../utils/encryption.js";
import { getVisibleStepsForQualification } from "../config/qualificationLevels.js";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const DOCUMENT_TYPES = ["Aadhaar", "Passport"];
const PIN_CODE_REGEX = /^[0-9]{4,10}$/;

const generateStudentId = async () => {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const candidate = `STU-${year}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await StudentProfile.exists({ studentId: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Failed to generate a unique student ID. Please try again.");
};

export const getOrCreateStudentProfile = async (userId) => {
  let profile = await StudentProfile.findOne({ userId });
  if (profile) return profile;

  const studentId = await generateStudentId();
  profile = await StudentProfile.create({ userId, studentId });
  return profile;
};

const maskDocumentValue = (last4) => (last4 ? `XXXX-XXXX-${last4}` : "");

const sanitizeProfile = (profile) => {
  const doc = profile.toObject({ getters: false });
  return {
    ...doc,
    sensitiveInfo: {
      documentType: doc.sensitiveInfo?.documentType || "",
      maskedValue: maskDocumentValue(doc.sensitiveInfo?.last4),
    },
  };
};

export const buildStatusPayload = (profile, qualification) => {
  const { completion, status, sections } = computeStudentProfileCompletion(profile, qualification);
  return {
    profile: sanitizeProfile(profile),
    completion,
    status,
    sections,
    currentStep: profile.currentStep,
    steps: getVisibleStepsForQualification(qualification),
  };
};

export const getMyStudentProfile = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    res.status(200).json(buildStatusPayload(profile, req.user.latestQualification));
  } catch (error) {
    next(error);
  }
};

const validatePersonalPayload = (body) => {
  const errors = [];

  if (body.gender && !GENDER_OPTIONS.includes(body.gender)) {
    errors.push(`Gender must be one of: ${GENDER_OPTIONS.join(", ")}.`);
  }

  if (body.dateOfBirth && Number.isNaN(new Date(body.dateOfBirth).getTime())) {
    errors.push("Date of birth is not a valid date.");
  }

  if (body.documentType && !DOCUMENT_TYPES.includes(body.documentType)) {
    errors.push(`Document type must be one of: ${DOCUMENT_TYPES.join(", ")}.`);
  }

  if (body.documentType && !body.documentValue) {
    errors.push("Document value is required when a document type is selected.");
  }

  ["currentAddress", "permanentAddress"].forEach((key) => {
    const address = body[key];
    if (address?.pinCode && !PIN_CODE_REGEX.test(String(address.pinCode))) {
      errors.push(`${key === "currentAddress" ? "Current" : "Permanent"} address PIN code is invalid.`);
    }
  });

  return errors;
};

const REQUIRED_PERSONAL_FIELD_LABELS = [
  ["personalInformation.fullName", "Full name"],
  ["personalInformation.gender", "Gender"],
  ["personalInformation.dateOfBirth", "Date of birth"],
  ["contactInformation.mobileNumber", "Mobile number"],
  ["contactInformation.email", "Email"],
  ["currentAddress.line1", "Current address line 1"],
  ["currentAddress.city", "Current address city"],
  ["currentAddress.state", "Current address state"],
  ["currentAddress.pinCode", "Current address PIN code"],
];

const getPath = (obj, path) => path.split(".").reduce((acc, key) => acc?.[key], obj);

// Multipart requests (photo upload) arrive with nested objects JSON-stringified;
// plain JSON requests already have real objects. Normalize both to the same shape.
const parseJsonField = (value) => {
  if (value === undefined || value === null || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const updateMyPersonalInformation = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const body = { ...(req.body || {}) };
    ["personalInformation", "contactInformation", "currentAddress", "permanentAddress"].forEach((key) => {
      if (body[key] !== undefined) body[key] = parseJsonField(body[key]);
    });
    if (typeof body.permanentSameAsCurrent === "string") {
      body.permanentSameAsCurrent = body.permanentSameAsCurrent === "true";
    }
    if (typeof body.advanceStep === "string") {
      body.advanceStep = body.advanceStep === "true";
    }

    const validationErrors = validatePersonalPayload(body);
    if (validationErrors.length > 0) {
      res.status(400).json({ message: validationErrors.join(" ") });
      return;
    }

    if (body.personalInformation) {
      Object.assign(profile.personalInformation, body.personalInformation);
    }
    if (body.contactInformation) {
      Object.assign(profile.contactInformation, body.contactInformation);
    }
    if (body.currentAddress) {
      Object.assign(profile.currentAddress, body.currentAddress);
    }
    if (typeof body.permanentSameAsCurrent === "boolean") {
      profile.permanentSameAsCurrent = body.permanentSameAsCurrent;
    }
    if (profile.permanentSameAsCurrent) {
      profile.permanentAddress = { ...profile.currentAddress.toObject() };
    } else if (body.permanentAddress) {
      Object.assign(profile.permanentAddress, body.permanentAddress);
    }

    if (req.file) {
      profile.personalInformation.photoUrl = `/uploads/profile-photos/${req.file.filename}`;
    }

    // Aadhaar/Passport: only ever store an AES-encrypted value + last4; the
    // plaintext number never touches the response and isn't logged.
    if (body.documentType && body.documentValue) {
      const digitsOnly = String(body.documentValue).trim();
      profile.sensitiveInfo.documentType = body.documentType;
      profile.sensitiveInfo.encryptedValue = encrypt(digitsOnly);
      profile.sensitiveInfo.last4 = digitsOnly.slice(-4);
    }

    if (body.advanceStep) {
      const missingField = REQUIRED_PERSONAL_FIELD_LABELS.find(
        ([path]) => !getPath(profile.toObject(), path),
      );
      if (missingField) {
        res.status(400).json({ message: `${missingField[1]} is required to continue.` });
        return;
      }
      const visibleSteps = getVisibleStepsForQualification(req.user.latestQualification);
      const currentIndex = visibleSteps.indexOf("PERSONAL");
      profile.currentStep = visibleSteps[currentIndex + 1] || "PERSONAL";
    }

    const { status } = computeStudentProfileCompletion(profile, req.user.latestQualification);
    profile.profileStatus = status;
    if (status === "COMPLETE" && !profile.completedAt) {
      profile.completedAt = new Date();
    }

    await profile.save();

    res.status(200).json(buildStatusPayload(profile, req.user.latestQualification));
  } catch (error) {
    next(error);
  }
};

// Generic step-advance for sections that live in their own collection
// (Academic Journey, and later Skills/Projects/Experience/...) rather than a
// single PATCH-able chunk of the profile document.
export const advanceProfileStep = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const { step } = req.body || {};

    if (!step || !PROFILE_STEPS.includes(step)) {
      res.status(400).json({ message: "A valid step is required." });
      return;
    }

    const { sections } = computeStudentProfileCompletion(profile, req.user.latestQualification);
    if (REQUIRED_SECTIONS.includes(step) && !sections[step]?.complete) {
      res.status(400).json({ message: "Please complete this section before continuing." });
      return;
    }

    const visibleSteps = getVisibleStepsForQualification(req.user.latestQualification);
    const currentIndex = visibleSteps.indexOf(step);
    profile.currentStep = currentIndex >= 0 ? visibleSteps[currentIndex + 1] || step : step;

    const { status } = computeStudentProfileCompletion(profile, req.user.latestQualification);
    profile.profileStatus = status;
    if (status === "COMPLETE" && !profile.completedAt) {
      profile.completedAt = new Date();
    }

    await profile.save();

    res.status(200).json(buildStatusPayload(profile, req.user.latestQualification));
  } catch (error) {
    next(error);
  }
};
