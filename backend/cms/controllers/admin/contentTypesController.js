import Content from "../../models/Content.js";
import ContentType from "../../models/ContentType.js";
import SchemaVersion from "../../models/SchemaVersion.js";
import Template from "../../models/Template.js";
import { CONFIG_KINDS, toActor } from "../../models/common.js";
import { cmsConfig } from "../../config.js";
import { SLUG_PATTERN, toSlug } from "../../shared/ids.js";
import { withFreshIds } from "../../shared/schemaUtils.js";
import { audit } from "../../services/audit.js";
import {
  defaultConfig,
  getPublishedConfig,
  publishConfigs,
  publishImpact,
  restoreConfigVersion,
  saveDrafts,
} from "../../services/contentTypes.js";
import { emit } from "../../services/events.js";
import { createPreviewToken } from "../../services/preview.js";
import { HttpError, badRequest, escapeRegex, notFound } from "../../utils/http.js";
import { autoSlug } from "../../utils/slugs.js";

const loadType = async (id) => {
  const contentType = await ContentType.findById(id);
  if (!contentType) throw notFound("Content type");
  return contentType;
};

const serialize = (contentType, extra = {}) => ({
  ...contentType.toObject(),
  id: String(contentType._id),
  ...extra,
});

const statusCounts = async (ids) => {
  const rows = await Content.aggregate([
    { $match: { contentTypeId: { $in: ids } } },
    { $group: { _id: { type: "$contentTypeId", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const map = {};
  rows.forEach(({ _id, count }) => {
    const key = String(_id.type);
    map[key] = map[key] || { total: 0 };
    map[key][_id.status] = count;
    map[key].total += count;
  });
  return map;
};

export const listContentTypes = async (req, res) => {
  const filter = {};
  if (req.query.status && ["draft", "published", "archived"].includes(req.query.status)) filter.status = req.query.status;
  else filter.status = { $ne: "archived" };
  if (req.query.q) filter.name = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i");

  const types = await ContentType.find(filter).select("-draft").sort({ updatedAt: -1 }).lean();
  const counts = await statusCounts(types.map((type) => type._id));
  res.json({ items: types.map((type) => ({ ...type, id: String(type._id), counts: counts[String(type._id)] || { total: 0 } })) });
};

export const createContentType = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) throw badRequest("Give the content type a name.");
  // const slug = toSlug(req.body?.slug || name);
  // if (!SLUG_PATTERN.test(slug)) throw badRequest("The URL slug can only use lowercase letters, numbers and dashes.");
  // The URL slug is always generated from the name — never typed by the admin.
  const slug = await autoSlug(ContentType, name, { fallback: "content" });

  // Starts blank — unless the admin explicitly chose one of their own templates.
  let fields = [];
  if (req.body?.templateId) {
    const template = await Template.findById(req.body.templateId).lean();
    if (!template) throw notFound("Template");
    fields = withFreshIds(template.fields || []);
  }

  const contentType = await ContentType.create({
    name: name.slice(0, 120),
    slug,
    description: String(req.body?.description || "").slice(0, 1000),
    icon: String(req.body?.icon || "FileText").slice(0, 40),
    draft: { form: { fields }, card: defaultConfig("card"), page: defaultConfig("page"), presentation: defaultConfig("presentation") },
    createdBy: toActor(req.cmsUser),
    updatedBy: toActor(req.cmsUser),
  });
  await audit(req, { action: "contentType.created", entityType: "contentType", entityId: contentType._id, entityLabel: contentType.name });
  res.status(201).json({ contentType: serialize(contentType) });
};

export const getContentType = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const publishedForm = await getPublishedConfig(contentType, "form");
  const counts = await statusCounts([contentType._id]);
  res.json({
    contentType: serialize(contentType, { counts: counts[String(contentType._id)] || { total: 0 } }),
    publishedForm,
  });
};

export const updateContentTypeMeta = async (req, res) => {
  const contentType = await loadType(req.params.id);
  // const { name, description, icon, slug } = req.body || {};
  const { name, description, icon } = req.body || {};
  if (name !== undefined) {
    if (!String(name).trim()) throw badRequest("Name can't be empty.");
    contentType.name = String(name).trim().slice(0, 120);
    // The slug follows the name until the first publish, then stays fixed so
    // live Edeco URLs never break.
    if (!CONFIG_KINDS.some((kind) => contentType.published?.[kind]?.version)) {
      contentType.slug = await autoSlug(ContentType, contentType.name, { fallback: "content", excludeId: contentType._id });
    }
  }
  if (description !== undefined) contentType.description = String(description).slice(0, 1000);
  if (icon !== undefined) contentType.icon = String(icon).slice(0, 40);
  // Admin-typed slugs are no longer accepted.
  // if (slug !== undefined && toSlug(slug) !== contentType.slug) {
  //   // Live URLs on Edeco are built from the slug — it is frozen once anything was published.
  //   if (CONFIG_KINDS.some((kind) => contentType.published?.[kind]?.version)) {
  //     throw badRequest("The URL slug can't change after the content type has been published.");
  //   }
  //   const next = toSlug(slug);
  //   if (!SLUG_PATTERN.test(next)) throw badRequest("The URL slug can only use lowercase letters, numbers and dashes.");
  //   contentType.slug = next;
  // }
  contentType.updatedBy = toActor(req.cmsUser);
  contentType.revision += 1;
  await contentType.save();
  await audit(req, { action: "contentType.updated", entityType: "contentType", entityId: contentType._id, entityLabel: contentType.name });
  if (contentType.status === "published") await emit("schema.updated", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, kind: "meta" });
  res.json({ contentType: serialize(contentType) });
};

export const saveContentTypeDraft = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const patch = Object.fromEntries(CONFIG_KINDS.filter((kind) => req.body?.[kind] !== undefined).map((kind) => [kind, req.body[kind]]));
  const { contentType: updated, changedKinds } = await saveDrafts(contentType, patch, { revision: req.body?.revision, actor: req.cmsUser });
  if (changedKinds.length && !req.body?.autosave) {
    await audit(req, { action: "contentType.draftSaved", entityType: "contentType", entityId: updated._id, entityLabel: updated.name, details: { kinds: changedKinds } });
  }
  res.json({ contentType: serialize(updated) });
};

export const getPublishImpact = async (req, res) => {
  res.json({ impact: await publishImpact(await loadType(req.params.id)) });
};

export const publishContentType = async (req, res) => {
  const contentType = await loadType(req.params.id);
  if (contentType.status === "archived") throw badRequest("Unarchive this content type before publishing.");
  const kinds = Array.isArray(req.body?.kinds) ? req.body.kinds : [];
  const { contentType: updated, versions } = await publishConfigs(contentType, kinds, { actor: req.cmsUser, note: String(req.body?.note || "").slice(0, 500) });
  await audit(req, { action: "contentType.published", entityType: "contentType", entityId: updated._id, entityLabel: updated.name, details: { versions } });
  res.json({ contentType: serialize(updated), versions });
};

export const listConfigVersions = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const kind = CONFIG_KINDS.includes(req.query.kind) ? req.query.kind : "form";
  const versions = await SchemaVersion.find({ ownerType: "contentType", ownerId: contentType._id, kind })
    .sort({ version: -1 })
    .limit(100)
    .select(req.query.full === "1" ? "" : "-schema")
    .lean();
  res.json({ items: versions, current: contentType.published?.[kind]?.version || 0 });
};

export const getConfigVersion = async (req, res) => {
  const version = await SchemaVersion.findOne({
    ownerType: "contentType",
    ownerId: req.params.id,
    kind: req.params.kind,
    version: Number(req.params.version),
  }).lean();
  if (!version) throw notFound("Version");
  res.json({ version });
};

export const restoreVersion = async (req, res) => {
  const contentType = await loadType(req.params.id);
  if (!CONFIG_KINDS.includes(req.params.kind)) throw badRequest("Unknown configuration kind.");
  const updated = await restoreConfigVersion(contentType, req.params.kind, req.params.version, { actor: req.cmsUser });
  await audit(req, {
    action: "contentType.versionRestored",
    entityType: "contentType",
    entityId: contentType._id,
    entityLabel: contentType.name,
    details: { kind: req.params.kind, version: Number(req.params.version) },
  });
  res.json({ contentType: serialize(updated) });
};

export const duplicateContentType = async (req, res) => {
  const source = await loadType(req.params.id);
  let slug = toSlug(`${source.slug}-copy`);
  let n = 2;
  while (await ContentType.exists({ slug })) slug = toSlug(`${source.slug}-copy-${n++}`);
  const copy = await ContentType.create({
    name: `${source.name} (copy)`,
    slug,
    description: source.description,
    icon: source.icon,
    draft: JSON.parse(JSON.stringify(source.draft)),
    createdBy: toActor(req.cmsUser),
    updatedBy: toActor(req.cmsUser),
  });
  await audit(req, { action: "contentType.duplicated", entityType: "contentType", entityId: copy._id, entityLabel: copy.name, details: { from: String(source._id) } });
  res.status(201).json({ contentType: serialize(copy) });
};

export const setContentTypeArchived = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const archive = req.body?.archived !== false;
  if (archive) {
    contentType.status = "archived";
  } else {
    const live = ["form", "card", "page"].every((kind) => contentType.published?.[kind]?.version);
    contentType.status = live ? "published" : "draft";
  }
  contentType.updatedBy = toActor(req.cmsUser);
  await contentType.save();
  await audit(req, { action: archive ? "contentType.archived" : "contentType.unarchived", entityType: "contentType", entityId: contentType._id, entityLabel: contentType.name });
  await emit("schema.updated", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, kind: "status", status: contentType.status });
  res.json({ contentType: serialize(contentType) });
};

export const deleteContentType = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const entries = await Content.countDocuments({ contentTypeId: contentType._id });
  if (entries) throw new HttpError(409, `This content type still has ${entries} entr${entries === 1 ? "y" : "ies"}. Archive it instead, or delete the entries first.`);
  await ContentType.deleteOne({ _id: contentType._id });
  // Published schema versions are history — they stay in place for audit.
  await audit(req, { action: "contentType.deleted", entityType: "contentType", entityId: contentType._id, entityLabel: contentType.name });
  await emit("schema.updated", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, kind: "deleted" });
  res.json({ ok: true });
};

export const createPreviewLink = async (req, res) => {
  const contentType = await loadType(req.params.id);
  const target = req.body?.target === "page" ? "page" : "card";
  const contentId = req.body?.contentId || null;
  if (contentId && !(await Content.exists({ _id: contentId, contentTypeId: contentType._id }))) throw notFound("Entry");
  const { token, expiresAt } = createPreviewToken({ target, contentTypeId: contentType._id, contentId, sample: !contentId, viewer: req.cmsUser });
  const path = `/cms-preview?token=${encodeURIComponent(token)}`;
  res.json({ token, expiresAt, path, url: cmsConfig.siteUrl ? `${cmsConfig.siteUrl}${path}` : path });
};
