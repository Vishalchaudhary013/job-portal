import crypto from "crypto";
import mongoose from "mongoose";
import Content from "../models/Content.js";
import ContentType from "../models/ContentType.js";
import Form from "../models/Form.js";
import Submission from "../models/Submission.js";
import { sampleDataFor } from "../shared/fieldTypes.js";
import { referenceableFields } from "../shared/schemaUtils.js";
import { HttpError, escapeRegex, isObjectId } from "../utils/http.js";
import { cached } from "./cache.js";
import { getDraftBundle, getPublishedBundle } from "./contentTypes.js";
import { verifyPreviewToken } from "./preview.js";

// The delivery layer: the ONLY way Edeco reads Form Builder data. It exposes
// published configuration and published entries, never drafts (except through
// a verified preview token). Both the portal's own public endpoints and the
// key-protected /api/cms/v1 API call these functions.

const CHOICE_TYPES = ["select", "multiSelect", "radio", "checkbox"];

const typeMeta = (contentType) => ({
  id: String(contentType._id),
  slug: contentType.slug,
  name: contentType.name,
  description: contentType.description,
  icon: contentType.icon,
  updatedAt: contentType.updatedAt,
});

const toEntry = (doc) => ({
  id: String(doc._id),
  slug: doc.published?.slug || doc.slug,
  title: doc.published?.title || doc.title,
  data: doc.published?.data || {},
  version: doc.published?.version || doc.version,
  formVersion: doc.published?.formVersion || 0,
  publishedAt: doc.published?.publishedAt || null,
});

const loadPublishedType = async (slug) => {
  const contentType = await ContentType.findOne({ slug: String(slug || "").toLowerCase(), status: "published" }).lean();
  if (!contentType) throw new HttpError(404, "Content type not found.");
  return contentType;
};

const buildFilters = async (contentType, bundle) => {
  const refs = referenceableFields(bundle.form?.fields || []);
  const wanted = bundle.presentation?.listing?.filterableFieldIds || [];
  const filters = [];
  for (const id of wanted) {
    const ref = refs.find((item) => item.id === id);
    if (!ref) continue;
    let options = [];
    if (CHOICE_TYPES.includes(ref.type) && ref.field.options?.length) {
      options = ref.field.options.map((option) => ({ label: option.label, value: String(option.value) }));
    } else if (ref.type === "checkbox") {
      options = [{ label: "Yes", value: "true" }, { label: "No", value: "false" }];
    } else {
      const values = await Content.distinct(`published.data.${ref.path}`, { contentTypeId: contentType._id, status: "published" });
      options = values
        .filter((value) => value !== null && value !== "" && ["string", "number", "boolean"].includes(typeof value))
        .slice(0, 50)
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((value) => ({ label: String(value), value: String(value) }));
    }
    // How many published entries carry each value (shown beside each option,
    // like the Jobs page filters).
    const counts = await Content.aggregate([
      { $match: { contentTypeId: contentType._id, status: "published" } },
      { $project: { value: `$published.data.${ref.path}` } },
      { $unwind: "$value" },
      { $group: { _id: { $toString: "$value" }, count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id).toLowerCase(), row.count]));
    options = options.map((option) => ({ ...option, count: countMap.get(String(option.value).toLowerCase()) || 0 }));
    filters.push({ fieldId: ref.id, key: ref.key, path: ref.path, label: ref.label, type: ref.type, options });
  }
  return filters;
};

// Same filter list built from in-memory entries — used by the preview, which
// shows draft data that isn't queryable as "published".
export const filtersFromItems = (bundle, items) => {
  const refs = referenceableFields(bundle.form?.fields || []);
  const read = (data, path) => path.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), data);
  return (bundle.presentation?.listing?.filterableFieldIds || [])
    .map((id) => refs.find((item) => item.id === id))
    .filter(Boolean)
    .map((ref) => {
      const countMap = new Map();
      const original = new Map();
      items.forEach((item) => {
        const value = read(item.data, ref.path);
        (Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]).forEach((entry) => {
          const key = String(entry).toLowerCase();
          countMap.set(key, (countMap.get(key) || 0) + 1);
          if (!original.has(key)) original.set(key, String(entry));
        });
      });
      let options;
      if (CHOICE_TYPES.includes(ref.type) && ref.field.options?.length) {
        options = ref.field.options.map((option) => ({ label: option.label, value: String(option.value) }));
      } else if (ref.type === "checkbox") {
        options = [{ label: "Yes", value: "true" }, { label: "No", value: "false" }];
      } else {
        options = [...original.values()].sort((a, b) => a.localeCompare(b)).map((value) => ({ label: value, value }));
      }
      options = options.map((option) => ({ ...option, count: countMap.get(String(option.value).toLowerCase()) || 0 }));
      return { fieldId: ref.id, key: ref.key, path: ref.path, label: ref.label, type: ref.type, options };
    });
};

// Content types

export const listPublishedTypes = () =>
  cached("types", async () => {
    const types = await ContentType.find({ status: "published" }).sort({ name: 1 }).lean();
    return Promise.all(
      types.map(async (contentType) => {
        const bundle = await getPublishedBundle(contentType);
        return {
          ...typeMeta(contentType),
          presentation: {
            heading: bundle.presentation.heading,
            showInNavigation: bundle.presentation.showInNavigation,
            navLabel: bundle.presentation.navLabel,
          },
        };
      }),
    );
  });

export const getPublishedType = (slug) =>
  cached(`type:${String(slug).toLowerCase()}`, async () => {
    const contentType = await loadPublishedType(slug);
    const bundle = await getPublishedBundle(contentType);
    return {
      contentType: typeMeta(contentType),
      formSchema: bundle.form,
      cardSchema: bundle.card,
      pageSchema: bundle.page,
      presentation: bundle.presentation,
      versions: bundle.versions,
      filters: await buildFilters(contentType, bundle),
    };
  });

// Entries

const normaliseQuery = (query = {}) => ({
  q: String(query.q || "").trim().slice(0, 100),
  page: Math.max(1, Number.parseInt(query.page, 10) || 1),
  // 0 = not requested -> the content type's configured page size applies.
  limit: Number.parseInt(query.limit, 10) > 0 ? Math.min(48, Number.parseInt(query.limit, 10)) : 0,
  sort: ["newest", "oldest", "title", "default"].includes(query.sort) ? query.sort : "default",
  filters: query.filters && typeof query.filters === "object" ? query.filters : {},
});

export const listPublishedEntries = async (typeSlug, rawQuery) => {
  const query = normaliseQuery(rawQuery);
  const cacheKey = `list:${String(typeSlug).toLowerCase()}:${crypto.createHash("sha1").update(JSON.stringify(query)).digest("hex")}`;

  return cached(cacheKey, async () => {
    const contentType = await loadPublishedType(typeSlug);
    const bundle = await getPublishedBundle(contentType);
    const listing = bundle.presentation.listing;
    const refs = referenceableFields(bundle.form?.fields || []);
    const limit = query.limit || Number(listing.pageSize) || 12;

    const mongoQuery = { contentTypeId: contentType._id, status: "published" };

    if (query.q && listing.searchable !== false) {
      const regex = new RegExp(escapeRegex(query.q), "i");
      const searchPaths = (listing.searchableFieldIds || [])
        .map((id) => refs.find((ref) => ref.id === id))
        .filter(Boolean)
        .map((ref) => `published.data.${ref.path}`);
      mongoQuery.$or = [{ "published.title": regex }, ...searchPaths.map((path) => ({ [path]: regex }))];
    }

    // Only fields the admin marked filterable can be filtered on.
    for (const id of listing.filterableFieldIds || []) {
      const ref = refs.find((item) => item.id === id);
      const raw = query.filters[id] ?? query.filters[ref?.key];
      if (!ref || raw === undefined || raw === "") continue;
      const values = (Array.isArray(raw) ? raw : String(raw).split(",")).slice(0, 20).map((value) => String(value).slice(0, 200));
      const typed = values.flatMap((value) => {
        if (ref.type === "checkbox" && !ref.field.options?.length) return [value === "true"];
        if (ref.type === "number" || ref.type === "rating") return Number.isFinite(Number(value)) ? [Number(value)] : [];
        return [value];
      });
      if (typed.length) mongoQuery[`published.data.${ref.path}`] = { $in: typed };
    }

    let sort = { "published.publishedAt": -1 };
    if (query.sort === "oldest") sort = { "published.publishedAt": 1 };
    else if (query.sort === "title") sort = { "published.title": 1 };
    else if (query.sort === "default" && listing.sortFieldId) {
      const ref = refs.find((item) => item.id === listing.sortFieldId);
      if (ref) sort = { [`published.data.${ref.path}`]: listing.sortDirection === "asc" ? 1 : -1, "published.publishedAt": -1 };
    }

    const [docs, total] = await Promise.all([
      Content.find(mongoQuery).sort(sort).skip((query.page - 1) * limit).limit(limit).lean(),
      Content.countDocuments(mongoQuery),
    ]);

    return {
      items: docs.map(toEntry),
      pagination: { page: query.page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  });
};

export const getPublishedEntry = (typeSlug, entrySlug) =>
  cached(`entry:${String(typeSlug).toLowerCase()}:${String(entrySlug).toLowerCase()}`, async () => {
    const contentType = await loadPublishedType(typeSlug);
    const doc = await Content.findOne({
      contentTypeId: contentType._id,
      status: "published",
      $or: [{ "published.slug": String(entrySlug).toLowerCase() }, ...(isObjectId(entrySlug) ? [{ _id: entrySlug }] : [])],
    }).lean();
    if (!doc) throw new HttpError(404, "Entry not found.");
    return { contentType: typeMeta(contentType), entry: toEntry(doc) };
  });

export const getPublishedEntryById = (id) =>
  cached(`entry-id:${id}`, async () => {
    if (!isObjectId(id)) throw new HttpError(404, "Entry not found.");
    const doc = await Content.findOne({ _id: id, status: "published" }).lean();
    if (!doc) throw new HttpError(404, "Entry not found.");
    const contentType = await ContentType.findOne({ _id: doc.contentTypeId, status: "published" }).lean();
    if (!contentType) throw new HttpError(404, "Entry not found.");
    return { contentType: typeMeta(contentType), entry: toEntry(doc) };
  });

const findRelated = async (contentTypeId, excludeId, { limit, matchPath, matchValue }) => {
  const base = { contentTypeId, status: "published", _id: { $ne: new mongoose.Types.ObjectId(String(excludeId)) } };
  let docs = [];
  if (matchPath && matchValue !== undefined && matchValue !== null && matchValue !== "") {
    const values = Array.isArray(matchValue) ? matchValue : [matchValue];
    docs = await Content.find({ ...base, [`published.data.${matchPath}`]: { $in: values } }).sort({ "published.publishedAt": -1 }).limit(limit).lean();
  }
  if (docs.length < limit) {
    const more = await Content.find({ ...base, _id: { $nin: [base._id.$ne, ...docs.map((doc) => doc._id)] } })
      .sort({ "published.publishedAt": -1 })
      .limit(limit - docs.length)
      .lean();
    docs = docs.concat(more);
  }
  return docs.map(toEntry);
};

export const getRelatedEntries = (id, { limit = 3, matchFieldId = null } = {}) => {
  const safeLimit = Math.min(12, Math.max(1, Number(limit) || 3));
  return cached(`related:${id}:${safeLimit}:${matchFieldId || ""}`, async () => {
    const { entry } = await getPublishedEntryById(id);
    const doc = await Content.findById(id).select("contentTypeId").lean();
    const contentType = await ContentType.findById(doc.contentTypeId).lean();
    const bundle = await getPublishedBundle(contentType);
    const ref = referenceableFields(bundle.form?.fields || []).find((item) => item.id === matchFieldId);
    const items = await findRelated(doc.contentTypeId, id, {
      limit: safeLimit,
      matchPath: ref?.path,
      matchValue: ref ? ref.path.split(".").reduce((acc, part) => acc?.[part], entry.data) : undefined,
    });
    return { items };
  });
};

// Response forms

export const publicFormSettings = (settings = {}) => ({
  submitLabel: settings.submitLabel || "Submit",
  successMessage: settings.successMessage || "Thanks — your response has been recorded.",
  requireLogin: settings.requireLogin !== false,
  allowMultiple: Boolean(settings.allowMultiple),
  closed: Boolean(settings.closed),
});

export const getPublishedForm = (slug) =>
  cached(`form:${String(slug).toLowerCase()}`, async () => {
    const form = await Form.findOne({ slug: String(slug || "").toLowerCase(), status: "published" }).lean();
    if (!form || !form.published?.version) throw new HttpError(404, "Form not found.");
    return {
      id: String(form._id),
      slug: form.slug,
      name: form.name,
      description: form.description,
      version: form.published.version,
      schema: form.published.schema,
      settings: publicFormSettings(form.published.settings),
    };
  });

// Preview

export const resolvePreview = async (token) => {
  const payload = verifyPreviewToken(token);
  const contentType = await ContentType.findById(payload.contentTypeId).lean();
  if (!contentType) throw new HttpError(404, "This content type no longer exists.");
  const bundle = getDraftBundle(contentType);

  let entry;
  if (payload.contentId) {
    const doc = await Content.findOne({ _id: payload.contentId, contentTypeId: contentType._id }).lean();
    if (!doc) throw new HttpError(404, "This entry no longer exists.");
    entry = { id: String(doc._id), slug: doc.slug, title: doc.title, data: doc.draft?.data || {}, status: doc.status, publishedAt: doc.published?.publishedAt || doc.updatedAt || null };
  } else {
    entry = { id: "preview", slug: "preview", title: "Sample entry", data: sampleDataFor(bundle.form.fields || []), status: "sample", publishedAt: new Date().toISOString() };
  }

  const related = payload.target === "page"
    ? (await Content.find({ contentTypeId: contentType._id, status: "published", ...(payload.contentId ? { _id: { $ne: payload.contentId } } : {}) })
        .sort({ "published.publishedAt": -1 })
        .limit(6)
        .lean()).map(toEntry)
    : [];

  // Card preview renders the whole listing page, so it needs a page of cards:
  // the chosen entry first, then the other entries' current drafts.
  let items = [];
  let filters = [];
  if (payload.target === "card") {
    const others = await Content.find({ contentTypeId: contentType._id, status: { $ne: "archived" }, ...(payload.contentId ? { _id: { $ne: payload.contentId } } : {}) })
      .sort({ updatedAt: -1 })
      .limit(11)
      .lean();
    items = [
      entry,
      ...others.map((doc) => ({ id: String(doc._id), slug: doc.slug, title: doc.title, data: doc.draft?.data || {}, status: doc.status, publishedAt: doc.published?.publishedAt || doc.updatedAt || null })),
    ];
    filters = filtersFromItems(bundle, items);
  }

  return {
    target: payload.target,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    contentType: typeMeta(contentType),
    formSchema: bundle.form,
    cardSchema: bundle.card,
    pageSchema: bundle.page,
    presentation: bundle.presentation,
    entry,
    related,
    items,
    filters,
  };
};

// Stats (Edeco admin dashboard)

export const getDeliveryStats = () =>
  cached("stats", async () => {
    const weekAgo = new Date(Date.now() - 7 * 864e5);
    const [contentTypes, publishedTypes, published, drafts, inReview, forms, submissions, newSubmissions, recentSubmissions] = await Promise.all([
      ContentType.countDocuments({ status: { $ne: "archived" } }),
      ContentType.countDocuments({ status: "published" }),
      Content.countDocuments({ status: "published" }),
      Content.countDocuments({ status: "draft" }),
      Content.countDocuments({ status: "review" }),
      Form.countDocuments({ status: "published" }),
      Submission.countDocuments({}),
      Submission.countDocuments({ status: "new" }),
      Submission.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);
    return { contentTypes, publishedTypes, content: { published, drafts, inReview }, forms, submissions: { total: submissions, new: newSubmissions, last7Days: recentSubmissions } };
  }, 60);
