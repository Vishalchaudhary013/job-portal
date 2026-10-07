import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import BuilderResume from "../models/builderResumeModel.js";
import { getOrCreateStudentProfile } from "./studentProfileController.js";
import { syncBuilderResumeToProfile } from "../services/builderResumeProfileSync.js";
import { sanitizeResumeData } from "../utils/sanitizeResumeHtml.js";

const isTruthy = (value) => value === true || value === "true" || value === "1" || value === 1;

const pickResumeFields = (body = {}) => {
  const out = {};
  if (body.resumeData !== undefined) {
    const parsed = typeof body.resumeData === "string" ? safeParse(body.resumeData) : body.resumeData;
    out.resumeData = sanitizeResumeData(parsed);
  }
  if (body.template !== undefined) out.template = String(body.template || "").trim() || "classic";
  if (body.font !== undefined) out.font = String(body.font || "").trim();
  if (body.sectionOrder !== undefined) {
    out.sectionOrder = Array.isArray(body.sectionOrder)
      ? body.sectionOrder
      : safeParse(body.sectionOrder) || [];
  }
  if (body.title !== undefined) out.title = String(body.title || "").trim();
  return out;
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const deriveTitle = (resume) => {
  const explicit = String(resume.title || "").trim();
  if (explicit) return explicit;
  const personal = resume.resumeData?.personal || {};
  return String(personal.title || personal.fullName || "").trim() || "Untitled resume";
};

const toClientShape = (resume) => ({
  id: resume._id,
  title: deriveTitle(resume),
  resumeData: resume.resumeData || null,
  template: resume.template || "classic",
  font: resume.font || "",
  sectionOrder: resume.sectionOrder || [],
  status: resume.status,
  fileUrl: resume.fileUrl || "",
  fileName: resume.fileName || "",
  finalizedAt: resume.finalizedAt || null,
  syncedToProfileAt: resume.syncedToProfileAt || null,
  updatedAt: resume.updatedAt,
  createdAt: resume.createdAt,
});

// Most-recently-touched resume for this student, so the builder can offer to
// resume where they left off. Returns null when they have none.
export const getCurrentBuilderResume = async (req, res, next) => {
  try {
    const resume = await BuilderResume.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ resume: resume ? toClientShape(resume) : null });
  } catch (error) {
    next(error);
  }
};

export const listMyBuilderResumes = async (req, res, next) => {
  try {
    const resumes = await BuilderResume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({ resumes: resumes.map(toClientShape) });
  } catch (error) {
    next(error);
  }
};

export const createBuilderResume = async (req, res, next) => {
  try {
    const profile = await getOrCreateStudentProfile(req.user._id);
    const resume = await BuilderResume.create({
      userId: req.user._id,
      studentProfileId: profile._id,
      status: "DRAFT",
      ...pickResumeFields(req.body || {}),
    });
    res.status(201).json({ resume: toClientShape(resume) });
  } catch (error) {
    next(error);
  }
};

export const updateBuilderResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid resume id." });
      return;
    }
    const resume = await BuilderResume.findOne({ _id: id, userId: req.user._id });
    if (!resume) {
      res.status(404).json({ message: "Resume not found." });
      return;
    }
    Object.assign(resume, pickResumeFields(req.body || {}));
    await resume.save();
    res.status(200).json({ resume: toClientShape(resume) });
  } catch (error) {
    next(error);
  }
};

// Multipart: `resume` = the PDF the builder rendered client-side, body.syncToProfile
// = whether to also merge the common fields into the student profile.
export const finalizeBuilderResume = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid resume id." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "A resume PDF is required to finish." });
      return;
    }

    const resume = await BuilderResume.findOne({ _id: id, userId: req.user._id });
    if (!resume) {
      res.status(404).json({ message: "Resume not found." });
      return;
    }

    // Nested objects arrive JSON-stringified in multipart requests.
    Object.assign(resume, pickResumeFields(req.body || {}));

    // Re-finalize: drop the previous PDF so uploads/ doesn't accumulate orphans.
    if (resume.fileUrl) {
      const previous = path.join(process.cwd(), resume.fileUrl.replace(/^\//, ""));
      fs.unlink(previous, () => {});
    }

    resume.fileUrl = `/uploads/builder-resumes/${req.file.filename}`;
    resume.fileName = req.file.originalname || `${deriveTitle(resume)}.pdf`;
    resume.fileSize = req.file.size || 0;
    resume.status = "SAVED";
    resume.finalizedAt = new Date();

    if (isTruthy(req.body?.syncToProfile)) {
      try {
        const profile = await syncBuilderResumeToProfile(req.user._id, resume.resumeData);
        resume.studentProfileId = profile._id;
        resume.syncedToProfileAt = new Date();
      } catch (syncError) {
        // The resume is still saved even if the profile merge fails — surface it
        // without losing the finalize.
        console.error("[finalizeBuilderResume] profile sync failed:", syncError.message);
      }
    }

    await resume.save();
    res.status(200).json({ resume: toClientShape(resume), syncedToProfile: Boolean(resume.syncedToProfileAt) });
  } catch (error) {
    next(error);
  }
};

// Internal — used by the form submit paths to attach a builder resume that the
// submitting user actually owns.
export const resolveBuilderResumeForForm = async (builderResumeId, userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(builderResumeId)) return null;
  const resume = await BuilderResume.findOne({
    _id: builderResumeId,
    userId,
    status: "SAVED",
  }).select("fileUrl fileName");
  if (!resume || !resume.fileUrl) return null;
  return { fileUrl: resume.fileUrl, fileName: resume.fileName || "resume.pdf" };
};

export const adminListBuilderResumes = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
    const resumes = await BuilderResume.find({ status: "SAVED" })
      .sort({ finalizedAt: -1 })
      .limit(limit)
      .populate("userId", "fullName email")
      .lean();

    res.status(200).json({
      resumes: resumes.map((resume) => ({
        id: resume._id,
        title: deriveTitle(resume),
        fileUrl: resume.fileUrl || "",
        fileName: resume.fileName || "",
        finalizedAt: resume.finalizedAt || null,
        syncedToProfile: Boolean(resume.syncedToProfileAt),
        author: resume.userId
          ? { id: resume.userId._id, fullName: resume.userId.fullName || "", email: resume.userId.email || "" }
          : null,
      })),
      total: await BuilderResume.countDocuments({ status: "SAVED" }),
    });
  } catch (error) {
    next(error);
  }
};
