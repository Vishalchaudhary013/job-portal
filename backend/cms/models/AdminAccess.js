import mongoose from "mongoose";
import { actorSchema } from "./common.js";

// Form Builder access for one Edeco admin. Identity (and the admin role itself)
// stays in Edeco; this only records what the admin may do *inside* the Form
// Builder. Admins without a record fall back to the system default.
const adminAccessSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, default: "" },
    name: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    permissions: { type: [String], default: [] },
    updatedBy: { type: actorSchema, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("CmsAdminAccess", adminAccessSchema, "cms_admin_access");
