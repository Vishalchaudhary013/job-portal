import Content, { CONTENT_STATUSES } from "../../models/Content.js";
import ContentType from "../../models/ContentType.js";
import ContentVersion from "../../models/ContentVersion.js";
import { toActor } from "../../models/common.js";
import { can } from "../../middleware/access.js";
import { audit } from "../../services/audit.js";
import { defaultConfig, draftConfig, editorFormSchema, getPublishedConfig } from "../../services/contentTypes.js";
import { createEntry, restoreEntryVersion, runTransition, saveEntryDraft, uniqueSlug } from "../../services/contents.js";
import { emit } from "../../services/events.js";
import { badRequest, escapeRegex, forbidden, isObjectId, notFound, paginated, parsePagination } from "../../utils/http.js";

const loadEntry = async (id) => {
  if (!isObjectId(id)) throw notFound("Entry");
  const entry = await Content.findById(id);
  if (!entry) throw notFound("Entry");
  const contentType = await ContentType.findById(entry.contentTypeId);
  if (!contentType) throw notFound("Content type");
  return { entry, contentType };
};

const serializeEntry = (entry) => {
  const plain = entry.toObject ? entry.toObject() : entry;
  return { ...plain, id: String(plain._id) };
};

const typeSummary = (contentType) => ({
  id: String(contentType._id),
  name: contentType.name,
  slug: contentType.slug,
  icon: contentType.icon,
  status: contentType.status,
  presentation: { ...defaultConfig("presentation"), ...draftConfig(contentType, "presentation") },
  formPublishedVersion: contentType.published?.form?.version || 0,
  revision: contentType.revision,
});

export const listContents = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (req.query.contentType && isObjectId(req.query.contentType)) filter.contentTypeId = req.query.contentType;
  if (CONTENT_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  else if (req.query.status !== "all") filter.status = { $ne: "archived" };
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i");
    filter.$or = [{ title: regex }, { slug: regex }];
  }
  if (req.query.changes === "1") filter.hasUnpublishedChanges = true;

  const sortOptions = { updated: { updatedAt: -1 }, created: { createdAt: -1 }, title: { title: 1 }, published: { "published.publishedAt": -1 } };
  const sort = sortOptions[req.query.sort] || sortOptions.updated;

  const [items, total] = await Promise.all([
    Content.find(filter).select("-draft.data -published.data").sort(sort).skip(skip).limit(limit).lean(),
    Content.countDocuments(filter),
  ]);
  const types = await ContentType.find({ _id: { $in: [...new Set(items.map((item) => String(item.contentTypeId)))] } })
    .select("name slug icon")
    .lean();
  const typeMap = Object.fromEntries(types.map((type) => [String(type._id), { id: String(type._id), name: type.name, slug: type.slug, icon: type.icon }]));
  res.json(
    paginated(
      items.map((item) => ({ ...item, id: String(item._id), contentType: typeMap[String(item.contentTypeId)] || null })),
      total,
      { page, limit },
    ),
  );
};

export const createContent = async (req, res) => {
  const contentType = await ContentType.findById(req.body?.contentTypeId);
  if (!contentType) throw notFound("Content type");
  if (contentType.status === "archived") throw badRequest("This content type is archived.");
  const entry = await createEntry(contentType, { data: req.body?.data || {}, slug: req.body?.slug }, req.cmsUser);
  await audit(req, { action: "content.created", entityType: "content", entityId: entry._id, entityLabel: entry.title, details: { contentType: contentType.slug } });
  res.status(201).json({ entry: serializeEntry(entry) });
};

export const getContent = async (req, res) => {
  const { entry, contentType } = await loadEntry(req.params.id);
  const publishedForm = await getPublishedConfig(contentType, "form");
  const formSchema = publishedForm || (await editorFormSchema(contentType));
  res.json({
    entry: serializeEntry(entry),
    contentType: typeSummary(contentType),
    formSchema,
    formSource: publishedForm ? "published" : "draft",
  });
};

// Editor bootstrap for a brand-new entry.
export const getNewContentContext = async (req, res) => {
  const contentType = await ContentType.findById(req.params.contentTypeId);
  if (!contentType) throw notFound("Content type");
  const publishedForm = await getPublishedConfig(contentType, "form");
  res.json({
    contentType: typeSummary(contentType),
    formSchema: publishedForm || (await editorFormSchema(contentType)),
    formSource: publishedForm ? "published" : "draft",
  });
};

export const updateContent = async (req, res) => {
  const { entry, contentType } = await loadEntry(req.params.id);
  const updated = await saveEntryDraft(contentType, entry, { data: req.body?.data || {}, slug: req.body?.slug, revision: req.body?.revision }, req.cmsUser);
  if (!req.body?.autosave) {
    await audit(req, { action: "content.draftSaved", entityType: "content", entityId: entry._id, entityLabel: updated.title });
  }
  res.json({ entry: serializeEntry(updated) });
};

const ACTION_PERMISSIONS = {
  submitReview: "content.write",
  publish: "content.publish",
  unpublish: "content.publish",
  archive: "content.publish",
  restore: "content.publish",
  discardChanges: "content.write",
};

export const contentAction = async (req, res) => {
  const action = req.params.action;
  const permission = ACTION_PERMISSIONS[action];
  if (!permission) throw badRequest(`Unknown action "${action}".`);
  if (!can(req, permission)) throw forbidden();
  const { entry, contentType } = await loadEntry(req.params.id);
  const updated = await runTransition(contentType, entry, action, { actor: req.cmsUser, note: String(req.body?.note || "").slice(0, 1000) });
  await audit(req, { action: `content.${action}`, entityType: "content", entityId: entry._id, entityLabel: updated.title, details: { status: updated.status, version: updated.version } });
  res.json({ entry: serializeEntry(updated) });
};

export const listContentVersions = async (req, res) => {
  const { entry } = await loadEntry(req.params.id);
  const items = await ContentVersion.find({ contentId: entry._id }).select(req.query.full === "1" ? "" : "-data").sort({ version: -1 }).limit(100).lean();
  res.json({ items });
};

export const getContentVersion = async (req, res) => {
  const version = await ContentVersion.findOne({ contentId: req.params.id, version: Number(req.params.version) }).lean();
  if (!version) throw notFound("Version");
  res.json({ version });
};

export const restoreContentVersion = async (req, res) => {
  const { entry, contentType } = await loadEntry(req.params.id);
  const updated = await restoreEntryVersion(contentType, entry, req.params.version, req.cmsUser);
  await audit(req, { action: "content.versionRestored", entityType: "content", entityId: entry._id, entityLabel: updated.title, details: { version: Number(req.params.version) } });
  res.json({ entry: serializeEntry(updated) });
};

export const duplicateContent = async (req, res) => {
  const { entry, contentType } = await loadEntry(req.params.id);
  const copy = await Content.create({
    contentTypeId: contentType._id,
    slug: await uniqueSlug(contentType._id, `${entry.slug}-copy`),
    title: `${entry.title} (copy)`,
    status: "draft",
    draft: { data: JSON.parse(JSON.stringify(entry.draft?.data || {})), formRevision: contentType.revision },
    mediaIds: entry.mediaIds,
    createdBy: toActor(req.cmsUser),
    updatedBy: toActor(req.cmsUser),
  });
  await audit(req, { action: "content.duplicated", entityType: "content", entityId: copy._id, entityLabel: copy.title, details: { from: String(entry._id) } });
  res.status(201).json({ entry: serializeEntry(copy) });
};

export const deleteContent = async (req, res) => {
  const { entry, contentType } = await loadEntry(req.params.id);
  const wasLive = entry.status === "published";
  await Content.deleteOne({ _id: entry._id });
  // Version history is kept for audit; it is unreachable from delivery.
  await audit(req, { action: "content.deleted", entityType: "content", entityId: entry._id, entityLabel: entry.title, details: { wasLive } });
  if (wasLive) {
    await emit("content.unpublished", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, contentId: String(entry._id), slug: entry.published?.slug || entry.slug, deleted: true });
  }
  res.json({ ok: true });
};
