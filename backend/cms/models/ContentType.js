import mongoose from "mongoose";
import { actorSchema } from "./common.js";

const publishStateSchema = new mongoose.Schema(
  {
    version: { type: Number, default: 0 }, // 0 = never published
    publishedAt: { type: Date, default: null },
    publishedBy: { type: actorSchema, default: null },
  },
  { _id: false },
);

// A content type is pure configuration: its form schema (what data exists),
// card schema (how an entry appears in listings), page schema (how the detail
// page is structured) and presentation settings (listing/search behaviour on
// Edeco). Each of the four is edited as a draft and published independently
// into an immutable SchemaVersion — Edeco only ever sees published versions.
const contentTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 96 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    icon: { type: String, default: "FileText", maxlength: 40 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },

    draft: {
      form: { type: mongoose.Schema.Types.Mixed, default: () => ({ fields: [] }) },
      card: { type: mongoose.Schema.Types.Mixed, default: null },
      page: { type: mongoose.Schema.Types.Mixed, default: null },
      presentation: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    // Monotonic counter bumped on every draft save — used for optimistic
    // concurrency so two admins can't silently overwrite each other.
    revision: { type: Number, default: 0 },

    published: {
      form: { type: publishStateSchema, default: () => ({}) },
      card: { type: publishStateSchema, default: () => ({}) },
      page: { type: publishStateSchema, default: () => ({}) },
      presentation: { type: publishStateSchema, default: () => ({}) },
    },
    // Which drafts differ from their published version.
    dirty: {
      form: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      page: { type: Boolean, default: true },
      presentation: { type: Boolean, default: true },
    },

    createdBy: { type: actorSchema, default: null },
    updatedBy: { type: actorSchema, default: null },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model("CmsContentType", contentTypeSchema, "cms_content_types");
