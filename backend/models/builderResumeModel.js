import mongoose from "mongoose";

export const BUILDER_RESUME_STATUS = ["DRAFT", "SAVED"];

// One document per resume a student builds in the Resume Builder tool.
// `resumeData` (the builder's own JSON shape — see
// frontend resume-builder/utils/resumeHelpers.js `createInitialResumeData`) is
// the source of truth; it is autosaved as the student edits (`DRAFT`) and, on
// download/finish, the generated PDF is stored and the record flipped to
// `SAVED` (`finalizedAt` set). A student can have many `SAVED` resumes — the
// "latest" one is surfaced to super admins.
const builderResumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentProfile", default: null },

    title: { type: String, default: "", trim: true },

    resumeData: { type: mongoose.Schema.Types.Mixed, default: null },
    template: { type: String, default: "classic", trim: true },
    font: { type: String, default: "", trim: true },
    sectionOrder: { type: [String], default: [] },

    status: { type: String, enum: BUILDER_RESUME_STATUS, default: "DRAFT" },

    fileUrl: { type: String, default: "", trim: true },
    fileName: { type: String, default: "", trim: true },
    fileSize: { type: Number, default: 0 },

    finalizedAt: { type: Date, default: null },
    syncedToProfileAt: { type: Date, default: null },
  },
  { timestamps: true },
);

builderResumeSchema.index({ userId: 1, updatedAt: -1 });
builderResumeSchema.index({ status: 1, finalizedAt: -1 });

const BuilderResume = mongoose.model("BuilderResume", builderResumeSchema);

export default BuilderResume;
