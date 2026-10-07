import mongoose from "mongoose";
import { actorSchema } from "./common.js";

export const DEFAULT_SUBMISSION_STATUSES = ["new", "in-review", "accepted", "rejected", "archived"];

export const defaultFormSettings = () => ({
  submitLabel: "Submit",
  successMessage: "Thanks — your response has been recorded.",
  requireLogin: true,
  allowMultiple: false, // one response per user per content entry
  closed: false,
  statuses: [...DEFAULT_SUBMISSION_STATUSES],
});

// A response form: collects submissions from Edeco users (as opposed to a
// content type's form, which is how admins author content). Same draft ->
// publish -> version lifecycle as content type configuration.
const formSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 96 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },

    draft: {
      schema: { type: mongoose.Schema.Types.Mixed, default: () => ({ fields: [] }) },
      settings: { type: mongoose.Schema.Types.Mixed, default: defaultFormSettings },
    },
    revision: { type: Number, default: 0 },
    published: {
      version: { type: Number, default: 0 },
      schema: { type: mongoose.Schema.Types.Mixed, default: null },
      settings: { type: mongoose.Schema.Types.Mixed, default: null },
      publishedAt: { type: Date, default: null },
      publishedBy: { type: actorSchema, default: null },
    },
    dirty: { type: Boolean, default: true },

    createdBy: { type: actorSchema, default: null },
    updatedBy: { type: actorSchema, default: null },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model("CmsForm", formSchema, "cms_forms");
