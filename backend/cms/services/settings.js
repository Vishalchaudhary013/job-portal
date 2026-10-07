import Setting from "../models/Setting.js";
import { PERMISSION_PRESETS } from "../utils/permissions.js";

const SYSTEM_KEY = "system";

export const DEFAULT_SYSTEM_SETTINGS = {
  // Applied to any Edeco admin the super admin hasn't configured explicitly.
  defaultAdminAccess: { enabled: true, permissions: PERMISSION_PRESETS.editor },
  // Content must pass through "review" before it can be published.
  requireReview: false,
};

let cache = null;
let cachedAt = 0;

export const getSystemSettings = async () => {
  if (cache && Date.now() - cachedAt < 30_000) return cache;
  const doc = await Setting.findOne({ key: SYSTEM_KEY }).lean();
  cache = { ...DEFAULT_SYSTEM_SETTINGS, ...(doc?.value || {}) };
  cachedAt = Date.now();
  return cache;
};

export const updateSystemSettings = async (patch) => {
  const current = await getSystemSettings();
  const value = { ...current, ...patch };
  await Setting.updateOne({ key: SYSTEM_KEY }, { $set: { value } }, { upsert: true });
  cache = value;
  cachedAt = Date.now();
  return value;
};
