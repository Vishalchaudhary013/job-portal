import AuditLog from "../models/AuditLog.js";
import { toActor } from "../models/common.js";

// Records an admin action. Never throws — an audit write failure must not fail
// the action that was already performed; it is logged instead.
export const audit = async (req, { action, entityType, entityId = "", entityLabel = "", details = {} }) => {
  try {
    await AuditLog.create({
      actor: toActor(req?.cmsUser),
      action,
      entityType,
      entityId: String(entityId || ""),
      entityLabel: String(entityLabel || "").slice(0, 300),
      details,
      ip: req?.ip || "",
    });
  } catch (error) {
    console.error("[cms] audit log write failed:", error.message);
  }
};
