import mongoose from "mongoose";
import { actorSchema } from "./common.js";

// Immutable history of every published version of an entry.
const contentVersionSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsContent", required: true },
    contentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsContentType", required: true },
    version: { type: Number, required: true },
    slug: { type: String, default: "" },
    title: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    formVersion: { type: Number, default: 0 },
    note: { type: String, default: "", maxlength: 500 },
    createdBy: { type: actorSchema, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);

contentVersionSchema.index({ contentId: 1, version: -1 }, { unique: true });

export default mongoose.model("CmsContentVersion", contentVersionSchema, "cms_content_versions");
