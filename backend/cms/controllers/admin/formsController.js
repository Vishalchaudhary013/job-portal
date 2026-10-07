import Form, { defaultFormSettings } from "../../models/Form.js";
import SchemaVersion from "../../models/SchemaVersion.js";
import Submission from "../../models/Submission.js";
import Template from "../../models/Template.js";
import { toActor } from "../../models/common.js";
import { SLUG_PATTERN, toSlug } from "../../shared/ids.js";
import { withFreshIds } from "../../shared/schemaUtils.js";
import { audit } from "../../services/audit.js";
import { emit } from "../../services/events.js";
import { formPublishImpact, publishForm, restoreFormVersion, saveFormDraft } from "../../services/forms.js";
import { HttpError, badRequest, escapeRegex, notFound } from "../../utils/http.js";
import { autoSlug } from "../../utils/slugs.js";

const loadForm = async (id) => {
  const form = await Form.findById(id);
  if (!form) throw notFound("Form");
  return form;
};

const serialize = (form, extra = {}) => ({ ...form.toObject(), id: String(form._id), ...extra });

export const listForms = async (req, res) => {
  const filter = {};
  if (["draft", "published", "archived"].includes(req.query.status)) filter.status = req.query.status;
  else filter.status = { $ne: "archived" };
  if (req.query.q) filter.name = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i");
  const forms = await Form.find(filter).select("-draft -published.schema").sort({ updatedAt: -1 }).lean();
  const counts = await Submission.aggregate([
    { $match: { formId: { $in: forms.map((form) => form._id) } } },
    { $group: { _id: "$formId", total: { $sum: 1 }, fresh: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } } } },
  ]);
  const map = Object.fromEntries(counts.map((row) => [String(row._id), { total: row.total, new: row.fresh }]));
  res.json({ items: forms.map((form) => ({ ...form, id: String(form._id), submissions: map[String(form._id)] || { total: 0, new: 0 } })) });
};

export const createForm = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) throw badRequest("Give the form a name.");
  // const slug = toSlug(req.body?.slug || name);
  // if (!SLUG_PATTERN.test(slug)) throw badRequest("The form slug can only use lowercase letters, numbers and dashes.");
  // The slug is always generated from the name — never typed by the admin.
  const slug = await autoSlug(Form, name, { fallback: "form" });

  let fields = [];
  if (req.body?.templateId) {
    const template = await Template.findById(req.body.templateId).lean();
    if (!template) throw notFound("Template");
    fields = withFreshIds(template.fields || []);
  }

  const form = await Form.create({
    name: name.slice(0, 120),
    slug,
    description: String(req.body?.description || "").slice(0, 1000),
    draft: { schema: { fields }, settings: defaultFormSettings() },
    createdBy: toActor(req.cmsUser),
    updatedBy: toActor(req.cmsUser),
  });
  await audit(req, { action: "form.created", entityType: "form", entityId: form._id, entityLabel: form.name });
  res.status(201).json({ form: serialize(form) });
};

export const getForm = async (req, res) => {
  const form = await loadForm(req.params.id);
  const submissions = await Submission.countDocuments({ formId: form._id });
  res.json({ form: serialize(form, { submissions }) });
};

export const updateFormMeta = async (req, res) => {
  const form = await loadForm(req.params.id);
  // const { name, description, slug } = req.body || {};
  const { name, description } = req.body || {};
  if (name !== undefined) {
    if (!String(name).trim()) throw badRequest("Name can't be empty.");
    form.name = String(name).trim().slice(0, 120);
    // Follows the name until the first publish; fixed after that because
    // cards and page buttons on Edeco open the form by its slug.
    if (!form.published?.version) form.slug = await autoSlug(Form, form.name, { fallback: "form", excludeId: form._id });
  }
  if (description !== undefined) form.description = String(description).slice(0, 1000);
  // Admin-typed slugs are no longer accepted.
  // if (slug !== undefined && toSlug(slug) !== form.slug) {
  //   if (form.published?.version) throw badRequest("The slug can't change after the form has been published — Edeco links point at it.");
  //   const next = toSlug(slug);
  //   if (!SLUG_PATTERN.test(next)) throw badRequest("The form slug can only use lowercase letters, numbers and dashes.");
  //   form.slug = next;
  // }
  form.updatedBy = toActor(req.cmsUser);
  form.revision += 1;
  await form.save();
  await audit(req, { action: "form.updated", entityType: "form", entityId: form._id, entityLabel: form.name });
  res.json({ form: serialize(form) });
};

export const saveFormDraftHandler = async (req, res) => {
  const form = await loadForm(req.params.id);
  const updated = await saveFormDraft(form, { schema: req.body?.schema, settings: req.body?.settings, revision: req.body?.revision }, req.cmsUser);
  if (!req.body?.autosave) await audit(req, { action: "form.draftSaved", entityType: "form", entityId: form._id, entityLabel: form.name });
  res.json({ form: serialize(updated) });
};

export const getFormPublishImpact = async (req, res) => {
  const form = await loadForm(req.params.id);
  const impact = formPublishImpact(form);
  impact.responses = await Submission.countDocuments({ formId: form._id });
  res.json({ impact });
};

export const publishFormHandler = async (req, res) => {
  const form = await loadForm(req.params.id);
  if (form.status === "archived") throw badRequest("Unarchive this form before publishing.");
  const updated = await publishForm(form, { actor: req.cmsUser, note: String(req.body?.note || "").slice(0, 500) });
  await audit(req, { action: "form.published", entityType: "form", entityId: form._id, entityLabel: form.name, details: { version: updated.published.version } });
  res.json({ form: serialize(updated) });
};

export const unpublishForm = async (req, res) => {
  const form = await loadForm(req.params.id);
  form.status = "draft";
  form.updatedBy = toActor(req.cmsUser);
  await form.save();
  await audit(req, { action: "form.unpublished", entityType: "form", entityId: form._id, entityLabel: form.name });
  await emit("schema.updated", { formId: String(form._id), formSlug: form.slug, kind: "responseForm", status: "draft" });
  res.json({ form: serialize(form) });
};

export const listFormVersions = async (req, res) => {
  const form = await loadForm(req.params.id);
  const items = await SchemaVersion.find({ ownerType: "form", ownerId: form._id }).sort({ version: -1 }).limit(100).select(req.query.full === "1" ? "" : "-schema").lean();
  res.json({ items, current: form.published?.version || 0 });
};

export const restoreFormVersionHandler = async (req, res) => {
  const form = await loadForm(req.params.id);
  const updated = await restoreFormVersion(form, req.params.version, req.cmsUser);
  await audit(req, { action: "form.versionRestored", entityType: "form", entityId: form._id, entityLabel: form.name, details: { version: Number(req.params.version) } });
  res.json({ form: serialize(updated) });
};

export const setFormArchived = async (req, res) => {
  const form = await loadForm(req.params.id);
  const archive = req.body?.archived !== false;
  form.status = archive ? "archived" : form.published?.version ? "published" : "draft";
  form.updatedBy = toActor(req.cmsUser);
  await form.save();
  await audit(req, { action: archive ? "form.archived" : "form.unarchived", entityType: "form", entityId: form._id, entityLabel: form.name });
  await emit("schema.updated", { formId: String(form._id), formSlug: form.slug, kind: "responseForm", status: form.status });
  res.json({ form: serialize(form) });
};

export const deleteForm = async (req, res) => {
  const form = await loadForm(req.params.id);
  const responses = await Submission.countDocuments({ formId: form._id });
  if (responses) throw new HttpError(409, `This form has ${responses} response${responses === 1 ? "" : "s"}. Archive it instead so the responses stay available.`);
  await Form.deleteOne({ _id: form._id });
  await audit(req, { action: "form.deleted", entityType: "form", entityId: form._id, entityLabel: form.name });
  await emit("schema.updated", { formId: String(form._id), formSlug: form.slug, kind: "responseForm", status: "deleted" });
  res.json({ ok: true });
};
