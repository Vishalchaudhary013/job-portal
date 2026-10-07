export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    if (details !== undefined) this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (what = "Resource") => new HttpError(404, `${what} not found.`);
export const forbidden = (message = "You do not have permission to do that.") => new HttpError(403, message);
export const conflict = (message, details) => new HttpError(409, message, details);

export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const paginated = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});

export const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isObjectId = (value) => /^[a-f0-9]{24}$/i.test(String(value || ""));

// Strips keys Mongo treats specially ("$..." operators, dotted paths) and
// prototype-pollution keys from arbitrary user JSON before it is stored.
export const cleanJson = (value, depth = 0) => {
  if (depth > 12) return null;
  if (Array.isArray(value)) return value.slice(0, 1000).map((item) => cleanJson(item, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".") || key === "__proto__" || key === "constructor" || key === "prototype") continue;
      out[key] = cleanJson(item, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") return value.slice(0, 200000);
  return value;
};

export const pick = (source = {}, keys = []) =>
  Object.fromEntries(keys.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
