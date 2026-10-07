import crypto from "crypto";
import { cmsConfig as env } from "../config.js";
import ApiKey, { API_SCOPES } from "../models/ApiKey.js";
import { HttpError } from "../utils/http.js";

// Server-to-server authentication for external consumers of /api/cms/v1
// (e.g. the main Edeco site). The portal's own pages don't need a key — they
// use the in-process public layer. Keys travel in
// `Authorization: Bearer <key>` (or `X-Api-Key`) and are compared by SHA-256
// hash; the bootstrap key from env is compared in constant time.

export const hashApiKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

export const generateApiKey = () => `fbk_${crypto.randomBytes(32).toString("base64url")}`;

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const lastTouched = new Map();

export const authenticateApiKey = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const key = (header.startsWith("Bearer ") ? header.slice(7) : req.headers["x-api-key"] || "").trim();
  if (!key) return next(new HttpError(401, "API key required."));

  if (env.bootstrapApiKey && env.bootstrapApiKey.length >= 24 && safeEqual(key, env.bootstrapApiKey)) {
    req.apiClient = { id: "bootstrap", name: "Bootstrap key", scopes: API_SCOPES };
    return next();
  }

  try {
    const record = await ApiKey.findOne({ hash: hashApiKey(key), revokedAt: null }).lean();
    if (!record) return next(new HttpError(401, "Invalid API key."));

    req.apiClient = { id: String(record._id), name: record.name, scopes: record.scopes };

    // Record usage at most once a minute per key.
    const last = lastTouched.get(String(record._id)) || 0;
    if (Date.now() - last > 60_000) {
      lastTouched.set(String(record._id), Date.now());
      ApiKey.updateOne({ _id: record._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireScope = (scope) => (req, res, next) => {
  if (req.apiClient?.scopes?.includes(scope)) return next();
  next(new HttpError(403, `This API key is missing the "${scope}" scope.`));
};
