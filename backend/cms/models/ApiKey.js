import mongoose from "mongoose";
import { actorSchema } from "./common.js";

export const API_SCOPES = ["content:read", "submissions:write", "preview:read", "stats:read"];

// Server-to-server credentials for Edeco. Only a SHA-256 hash is stored; the
// plaintext key is shown once at creation.
const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    prefix: { type: String, required: true }, // first chars, for identification in the UI
    hash: { type: String, required: true, unique: true, select: false },
    scopes: { type: [String], default: API_SCOPES },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    createdBy: { type: actorSchema, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("CmsApiKey", apiKeySchema, "cms_api_keys");
