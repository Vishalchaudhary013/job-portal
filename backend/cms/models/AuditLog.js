import mongoose from "mongoose";
import { actorSchema } from "./common.js";

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: actorSchema, default: null },
    action: { type: String, required: true, index: true }, // e.g. "content.published"
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: "", index: true },
    entityLabel: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("CmsAuditLog", auditLogSchema, "cms_audit_logs");
