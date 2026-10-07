import mongoose from "mongoose";
import { actorSchema } from "./common.js";

// Immutable published snapshot of one configuration (form/card/page/
// presentation) of a content type, or of a response form's schema.
// Never updated or deleted — restoring an old version copies it into the draft.
const schemaVersionSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ["contentType", "form"], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    kind: { type: String, enum: ["form", "card", "page", "presentation"], required: true },
    version: { type: Number, required: true },
    schema: { type: mongoose.Schema.Types.Mixed, required: true },
    note: { type: String, default: "", maxlength: 500 },
    publishedBy: { type: actorSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);

schemaVersionSchema.index({ ownerType: 1, ownerId: 1, kind: 1, version: -1 }, { unique: true });

export default mongoose.model("CmsSchemaVersion", schemaVersionSchema, "cms_schema_versions");
