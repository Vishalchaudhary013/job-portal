import AcademicRecord from "../models/academicRecordModel.js";
import { getOrCreateStudentProfile } from "./studentProfileController.js";
import StudentProfile from "../models/studentProfileModel.js";
import { ACADEMIC_RECORD_TEMPLATES, isValidRecordType } from "../config/academicRecordTemplates.js";

// Multipart requests (document upload) arrive with nested arrays/objects
// JSON-stringified; plain JSON requests already have real objects/arrays.
const parseJsonField = (value) => {
  if (value === undefined || value === null || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const validateRecordPayload = (body) => {
  const errors = [];

  if (!body.recordType || !isValidRecordType(body.recordType)) {
    errors.push("A valid record type is required.");
    return errors;
  }

  if (!body.institutionName) {
    errors.push(`${ACADEMIC_RECORD_TEMPLATES[body.recordType].commonLabels.institutionName} is required.`);
  }

  if (!body.isCurrent && !body.passingYear) {
    errors.push("Passing year is required unless this qualification is currently in progress.");
  }

  const template = ACADEMIC_RECORD_TEMPLATES[body.recordType];
  const details = body.details || {};
  template.fields
    .filter((field) => field.required)
    .forEach((field) => {
      if (!details[field.key]) {
        errors.push(`${field.label} is required.`);
      }
    });

  return errors;
};

const syncRecordCount = async (studentProfileId) => {
  const count = await AcademicRecord.countDocuments({ studentProfileId });
  await StudentProfile.updateOne({ _id: studentProfileId }, { academicRecordsCount: count });
};

export const listMyAcademicRecords = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const records = await AcademicRecord.find({ studentProfileId: profile._id }).sort({ passingYear: 1, createdAt: 1 });
    res.status(200).json({ records });
  } catch (error) {
    next(error);
  }
};

const normalizeBody = (req) => {
  const body = { ...(req.body || {}) };
  ["subjects", "semesters", "details"].forEach((key) => {
    if (body[key] !== undefined) body[key] = parseJsonField(body[key]);
  });
  if (typeof body.isCurrent === "string") body.isCurrent = body.isCurrent === "true";
  if (body.passingYear !== undefined && body.passingYear !== "") body.passingYear = Number(body.passingYear);
  if (body.percentage !== undefined && body.percentage !== "") body.percentage = Number(body.percentage);
  if (body.cgpa !== undefined && body.cgpa !== "") body.cgpa = Number(body.cgpa);
  return body;
};

export const createAcademicRecord = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const body = normalizeBody(req);

    const validationErrors = validateRecordPayload(body);
    if (validationErrors.length > 0) {
      res.status(400).json({ message: validationErrors.join(" ") });
      return;
    }

    const record = await AcademicRecord.create({
      userId: req.user._id,
      studentProfileId: profile._id,
      recordType: body.recordType,
      institutionName: body.institutionName || "",
      boardOrUniversity: body.boardOrUniversity || "",
      passingYear: body.passingYear || null,
      isCurrent: Boolean(body.isCurrent),
      percentage: body.percentage ?? null,
      cgpa: body.cgpa ?? null,
      subjects: Array.isArray(body.subjects) ? body.subjects : [],
      semesters: Array.isArray(body.semesters) ? body.semesters : [],
      details: body.details || {},
      documentUrl: req.file ? `/uploads/academic-documents/${req.file.filename}` : "",
    });

    await syncRecordCount(profile._id);

    res.status(201).json({ record });
  } catch (error) {
    next(error);
  }
};

const findOwnRecord = async (req) => {
  const profile = await getOrCreateStudentProfile(req.user._id);
  const record = await AcademicRecord.findOne({ _id: req.params.id, studentProfileId: profile._id });
  return { profile, record };
};

export const updateAcademicRecord = async (req, res, next) => {
  try {
    const { profile, record } = await findOwnRecord(req);
    if (!record) {
      res.status(404).json({ message: "Academic record not found." });
      return;
    }

    const body = normalizeBody(req);
    const merged = { ...record.toObject(), ...body };

    const validationErrors = validateRecordPayload(merged);
    if (validationErrors.length > 0) {
      res.status(400).json({ message: validationErrors.join(" ") });
      return;
    }

    if (body.recordType) record.recordType = body.recordType;
    if (body.institutionName !== undefined) record.institutionName = body.institutionName;
    if (body.boardOrUniversity !== undefined) record.boardOrUniversity = body.boardOrUniversity;
    if (body.passingYear !== undefined) record.passingYear = body.passingYear || null;
    if (body.isCurrent !== undefined) record.isCurrent = Boolean(body.isCurrent);
    if (body.percentage !== undefined) record.percentage = body.percentage;
    if (body.cgpa !== undefined) record.cgpa = body.cgpa;
    if (Array.isArray(body.subjects)) record.subjects = body.subjects;
    if (Array.isArray(body.semesters)) record.semesters = body.semesters;
    if (body.details) record.details = { ...record.details, ...body.details };
    if (req.file) record.documentUrl = `/uploads/academic-documents/${req.file.filename}`;

    await record.save();
    await syncRecordCount(profile._id);

    res.status(200).json({ record });
  } catch (error) {
    next(error);
  }
};

export const deleteAcademicRecord = async (req, res, next) => {
  try {
    const { profile, record } = await findOwnRecord(req);
    if (!record) {
      res.status(404).json({ message: "Academic record not found." });
      return;
    }

    await record.deleteOne();
    await syncRecordCount(profile._id);

    res.status(200).json({ message: "Academic record deleted." });
  } catch (error) {
    next(error);
  }
};
