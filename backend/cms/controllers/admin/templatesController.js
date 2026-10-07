import ContentType from "../../models/ContentType.js";
import Form from "../../models/Form.js";
import Template from "../../models/Template.js";
import { toActor } from "../../models/common.js";
import { flattenFields, validateSchemaDefinition, withFreshIds } from "../../shared/schemaUtils.js";
import { audit } from "../../services/audit.js";
import { badRequest, cleanJson, escapeRegex, notFound } from "../../utils/http.js";

export const listTemplates = async (req, res) => {
  const filter = req.query.q ? { name: new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i") } : {};
  const items = await Template.find(filter).select("-fields").sort({ updatedAt: -1 }).lean();
  res.json({ items: items.map((item) => ({ ...item, id: String(item._id) })) });
};

export const getTemplate = async (req, res) => {
  const template = await Template.findById(req.params.id).lean();
  if (!template) throw notFound("Template");
  res.json({ template: { ...template, id: String(template._id) } });
};

// Saves fields as a reusable template — from the request body, or copied from
// an existing content type / response form draft.
export const createTemplate = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) throw badRequest("Give the template a name.");

  let fields = req.body?.fields;
  if (req.body?.fromContentTypeId) {
    const contentType = await ContentType.findById(req.body.fromContentTypeId).lean();
    if (!contentType) throw notFound("Content type");
    fields = contentType.draft?.form?.fields || [];
  } else if (req.body?.fromFormId) {
    const form = await Form.findById(req.body.fromFormId).lean();
    if (!form) throw notFound("Form");
    fields = form.draft?.schema?.fields || [];
  }
  fields = cleanJson(fields);
  if (!Array.isArray(fields) || !fields.length) throw badRequest("A template needs at least one field.");
  const problems = validateSchemaDefinition(fields);
  if (problems.length) throw badRequest("Fix the form's problems before saving it as a template.", { problems: problems.map((problem) => problem.message) });

  const fresh = withFreshIds(fields);
  const template = await Template.create({
    name: name.slice(0, 120),
    description: String(req.body?.description || "").slice(0, 1000),
    fields: fresh,
    fieldCount: flattenFields(fresh).length,
    createdBy: toActor(req.cmsUser),
  });
  await audit(req, { action: "template.created", entityType: "template", entityId: template._id, entityLabel: template.name });
  res.status(201).json({ template: { ...template.toObject(), id: String(template._id) } });
};

export const updateTemplate = async (req, res) => {
  const template = await Template.findById(req.params.id);
  if (!template) throw notFound("Template");
  if (req.body?.name !== undefined) {
    if (!String(req.body.name).trim()) throw badRequest("Name can't be empty.");
    template.name = String(req.body.name).trim().slice(0, 120);
  }
  if (req.body?.description !== undefined) template.description = String(req.body.description).slice(0, 1000);
  await template.save();
  await audit(req, { action: "template.updated", entityType: "template", entityId: template._id, entityLabel: template.name });
  res.json({ template: { ...template.toObject(), id: String(template._id) } });
};

export const deleteTemplate = async (req, res) => {
  const template = await Template.findByIdAndDelete(req.params.id);
  if (!template) throw notFound("Template");
  await audit(req, { action: "template.deleted", entityType: "template", entityId: template._id, entityLabel: template.name });
  res.json({ ok: true });
};
