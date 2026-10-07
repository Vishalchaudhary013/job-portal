import mongoose from "mongoose";
import { actorSchema } from "./common.js";

// A reusable set of fields an admin saved from one of their own forms. There
// are no built-in templates: the library starts empty and is filled by admins.
const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    fields: { type: mongoose.Schema.Types.Mixed, default: [] },
    fieldCount: { type: Number, default: 0 },
    createdBy: { type: actorSchema, default: null },
  },
  { timestamps: true, minimize: false },
);

export default mongoose.model("CmsTemplate", templateSchema, "cms_templates");
