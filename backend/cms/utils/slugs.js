import { toSlug } from "../shared/ids.js";
import { escapeRegex } from "./http.js";

// Slugs are never typed by admins: they are generated from the name/title
// (lowercase, spaces and symbols become "-") and made unique with -2, -3, …
export const autoSlug = async (Model, text, { fallback = "item", excludeId = null, filter = {} } = {}) => {
  const base = toSlug(text) || fallback;
  const pattern = new RegExp(`^${escapeRegex(base)}(?:-(\\d+))?$`);
  const taken = await Model.find({ ...filter, slug: pattern, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    .select("slug")
    .lean();
  if (!taken.some((doc) => doc.slug === base)) return base;
  const numbers = taken.map((doc) => Number(doc.slug.match(pattern)?.[1] || 1));
  return `${base}-${Math.max(...numbers) + 1}`;
};
