import mongoose from "mongoose";
import { RECORD_TYPES } from "../config/academicRecordTemplates.js";

// One document per historical academic qualification (spec §11/§35/§46) — a
// student keeps a full academic history. Template-specific fields (stream,
// semesters, thesis status, ...) live in `details`; the frontend
// renders/validates them from `academicRecordTemplates.js` rather than the
// schema needing per-type shape.
const academicRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
    },
    recordType: {
      type: String,
      enum: RECORD_TYPES,
      required: true,
    },

    institutionName: { type: String, default: "", trim: true },
    boardOrUniversity: { type: String, default: "", trim: true },
    passingYear: { type: Number, default: null },
    isCurrent: { type: Boolean, default: false },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    cgpa: { type: Number, default: null, min: 0, max: 10 },

    subjects: [
      {
        _id: false,
        name: { type: String, trim: true },
        marks: { type: Number },
      },
    ],
    semesters: [
      {
        _id: false,
        semester: { type: Number },
        sgpa: { type: Number },
        credits: { type: Number },
        backlogs: { type: Number, default: 0 },
      },
    ],

    // Template-specific fields (trade, stream, supervisor, thesisStatus, ...)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },

    documentUrl: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

academicRecordSchema.index({ studentProfileId: 1 });

const AcademicRecord = mongoose.model("AcademicRecord", academicRecordSchema);

export default AcademicRecord;
