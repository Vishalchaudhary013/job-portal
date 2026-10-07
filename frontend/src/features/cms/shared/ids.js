// GENERATED from backend/cms/shared — do not edit here. Run `npm run sync:cms-shared` in backend/.
// Stable identifiers for schema nodes (fields, card elements, page blocks).
// IDs never change once created — keys/labels can, so every cross-reference
// between schemas (card -> field, page block -> field, condition -> field)
// is made by ID.

const randomPart = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14).padEnd(12, "0");
};

export const createId = (prefix = "fld") => `${prefix}_${randomPart()}`;

// "Course Fee (INR)" -> "courseFeeInr". Keys are what Edeco sees in `data`, so
// they are restricted to a safe identifier shape.
export const toKey = (label = "") => {
  const words = String(label)
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean);
  if (!words.length) return "";
  const key = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
  return /^[a-z]/.test(key) ? key.slice(0, 64) : `f${key}`.slice(0, 64);
};

export const KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

export const toSlug = (value = "") =>
  String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
