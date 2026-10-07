import mongoose from "mongoose";

// Who did something. Identity lives in Edeco; we keep a denormalised snapshot
// so lists and audit logs render without calling Edeco.
export const actorSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false },
);

export const toActor = (user) =>
  user ? { id: String(user.id), name: user.name || "", email: user.email || "", role: user.role || "" } : null;

// Draft/published configuration kinds that a content type versions independently.
export const CONFIG_KINDS = ["form", "card", "page", "presentation"];
