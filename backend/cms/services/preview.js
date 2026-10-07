import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cmsConfig } from "../config.js";
import { HttpError } from "../utils/http.js";

// Preview links. A preview shows UNPUBLISHED configuration and data, so it is
// only reachable through a short-lived token signed with a secret that never
// leaves the server. Tokens are scoped to one target (card or page of one
// content type, optionally one entry) and can't be forged or widened.

const AUDIENCE = "edeco-cms-preview";

export const createPreviewToken = ({ target, contentTypeId, contentId = null, sample = false, viewer }) => {
  if (!cmsConfig.previewEnabled) throw new HttpError(503, "Preview is not configured on this server (CMS_PREVIEW_SECRET).");
  const expiresInSeconds = cmsConfig.previewTtlMinutes * 60;
  const token = jwt.sign(
    { target, contentTypeId: String(contentTypeId), contentId: contentId ? String(contentId) : null, sample: Boolean(sample), by: viewer?.id || null },
    cmsConfig.previewSecret,
    { audience: AUDIENCE, expiresIn: expiresInSeconds, jwtid: crypto.randomUUID() },
  );
  return { token, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
};

export const verifyPreviewToken = (token) => {
  if (!cmsConfig.previewEnabled) throw new HttpError(503, "Preview is not configured.");
  try {
    return jwt.verify(String(token || ""), cmsConfig.previewSecret, { audience: AUDIENCE });
  } catch (error) {
    throw new HttpError(error.name === "TokenExpiredError" ? 410 : 401, error.name === "TokenExpiredError" ? "This preview link has expired." : "Invalid preview link.");
  }
};
