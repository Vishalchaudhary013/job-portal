import Media from "../models/Media.js";
import { cmsConfig } from "../config.js";
import { MIME_TYPES, checkAgainstField, removeFile, verifyFileSignature } from "../middleware/upload.js";
import {
  getDeliveryStats,
  getPublishedEntry,
  getPublishedEntryById,
  getPublishedForm,
  getPublishedType,
  getRelatedEntries,
  listPublishedEntries,
  listPublishedTypes,
  resolvePreview,
} from "../services/delivery.js";
import { createSubmission, findUploadField } from "../services/submissions.js";
import { badRequest, isObjectId, notFound } from "../utils/http.js";

// Shared handlers for the two delivery surfaces:
//   /api/cms/public/*  — the portal's own pages (no key; published data only)
//   /api/cms/v1/*      — external server-to-server consumers (API key)
// External consumers get absolute media URLs; the portal resolves relative
// ones itself with resolveAssetUrl().

const absoluteBase = (req) => cmsConfig.publicBaseUrl || `${req.protocol}://${req.get("host")}`;

const absolutize = (value, base) => {
  if (Array.isArray(value)) return value.map((item) => absolutize(item, base));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = key === "url" && typeof item === "string" && item.startsWith("/") ? `${base}${item}` : absolutize(item, base);
    }
    return out;
  }
  return value;
};

const send = (req, res, payload, { absolute = false, cache = true } = {}) => {
  // Browsers always revalidate (a publish must show up immediately); the
  // server-side delivery cache — cleared on every publish — keeps this cheap.
  // res.setHeader("Cache-Control", cache ? "public, max-age=60, stale-while-revalidate=300" : "no-store");
  res.setHeader("Cache-Control", cache ? "no-cache" : "no-store");
  res.json(absolute ? absolutize(payload, absoluteBase(req)) : payload);
};

// Express 5's default query parser is "simple": `filters[location]=pune`
// arrives as a literal key, so filters are collected here.
const readListQuery = (query) => {
  const filters = {};
  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^filters\[([\w-]{1,64})\]$/);
    if (match) filters[match[1]] = value;
  }
  if (typeof query.filters === "string") {
    try {
      Object.assign(filters, JSON.parse(query.filters));
    } catch {
      // ignore malformed JSON filters
    }
  }
  return { q: query.q, page: query.page, limit: query.limit, sort: query.sort, filters };
};

export const deliveryHandlers = ({ absolute }) => ({
  listTypes: async (req, res) => send(req, res, { items: await listPublishedTypes() }, { absolute }),
  getType: async (req, res) => send(req, res, await getPublishedType(req.params.slug), { absolute }),
  listEntries: async (req, res) => send(req, res, await listPublishedEntries(req.params.slug, readListQuery(req.query)), { absolute }),
  getEntry: async (req, res) => send(req, res, await getPublishedEntry(req.params.slug, req.params.entrySlug), { absolute }),
  getEntryById: async (req, res) => send(req, res, await getPublishedEntryById(req.params.id), { absolute }),
  getRelated: async (req, res) =>
    send(req, res, await getRelatedEntries(req.params.id, { limit: req.query.limit, matchFieldId: req.query.matchFieldId || null }), { absolute }),
  getForm: async (req, res) => send(req, res, await getPublishedForm(req.params.slug), { absolute }),
  getPreview: async (req, res) => {
    const token = req.params.token || req.query.token;
    if (!token) throw badRequest("Missing preview token.");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    send(req, res, await resolvePreview(token), { absolute, cache: false });
  },
  getStats: async (req, res) => send(req, res, await getDeliveryStats(), { cache: false }),
});

// Submissions

// Portal: the submitting user is whoever the EXISTING Edeco session says it is
// (attachUserIfPresent) — never a client-supplied id.
export const submitFromPortal = async (req, res) => {
  const user = req.user ? { id: String(req.user._id), email: req.user.email, name: req.user.fullName } : null;
  const { submission, successMessage } = await createSubmission({
    slug: req.params.slug,
    data: req.body?.data || {},
    user,
    contentId: req.body?.contentId || null,
    source: "edeco",
    context: { ...(req.body?.context || {}), userAgent: req.get("user-agent") || "" },
  });
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ id: String(submission._id), status: submission.status, message: successMessage });
};

// External consumer: it authenticated with an API key and vouches for the user.
export const submitFromApi = async (req, res) => {
  const user = req.body?.user?.id ? { id: String(req.body.user.id).slice(0, 64), email: String(req.body.user.email || "").slice(0, 200), name: String(req.body.user.name || "").slice(0, 200) } : null;
  const { submission, successMessage } = await createSubmission({
    slug: req.params.slug,
    data: req.body?.data || {},
    user,
    contentId: req.body?.contentId || null,
    source: String(req.body?.source || `api:${req.apiClient?.name || "client"}`),
    context: req.body?.context || {},
  });
  res.status(201).json({ id: String(submission._id), status: submission.status, message: successMessage });
};

// Attachment for a file/image field of a published response form. Stored
// privately; the returned reference is put into the submission's data.
export const uploadSubmissionFile = async (req, res) => {
  if (!req.file) throw badRequest("Choose a file.");
  try {
    const { field, form } = await findUploadField(req.params.slug, String(req.query.fieldId || ""));
    if (form.published.settings?.requireLogin !== false && !req.user && !req.apiClient) throw badRequest("Please sign in to upload files.");
    const fieldProblem = checkAgainstField(req.file, field);
    if (fieldProblem) throw badRequest(fieldProblem);
    if (!(await verifyFileSignature(req.file))) throw badRequest("The file's contents don't match its type.");

    const media = await Media.create({
      url: "/pending",
      filename: req.file.filename,
      originalName: String(req.file.originalname || "").slice(0, 255),
      mime: req.file.mimetype,
      size: req.file.size,
      kind: MIME_TYPES[req.file.mimetype].kind,
      source: "submission",
      metadata: { formSlug: form.slug, fieldId: field.id, userId: req.user ? String(req.user._id) : null },
    });
    // Only admins can open this URL (see mediaController.downloadMedia).
    media.url = `/api/cms/admin/media/${media._id}/file`;
    await media.save();
    res.status(201).json({ id: String(media._id), url: media.url, name: media.originalName, mime: media.mime, size: media.size });
  } catch (error) {
    await removeFile(req.file.path);
    throw error;
  }
};

export const getMediaInfo = async (req, res) => {
  if (!isObjectId(req.params.id)) throw notFound("Media");
  const media = await Media.findOne({ _id: req.params.id, source: "library" }).select("url mime size kind alt title originalName createdAt").lean();
  if (!media) throw notFound("Media");
  send(req, res, { media: { id: String(media._id), ...media, _id: undefined } }, { absolute: true });
};
