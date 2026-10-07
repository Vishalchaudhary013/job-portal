import Form, { DEFAULT_SUBMISSION_STATUSES, defaultFormSettings } from "../models/Form.js";
import SchemaVersion from "../models/SchemaVersion.js";
import { toActor } from "../models/common.js";
import { fieldHasValue } from "../shared/fieldTypes.js";
import { diffSchemas, flattenFields, validateSchemaDefinition } from "../shared/schemaUtils.js";
import { HttpError, badRequest, cleanJson, conflict } from "../utils/http.js";
import { emit } from "./events.js";

const SETTING_KEYS = ["submitLabel", "successMessage", "requireLogin", "allowMultiple", "closed", "statuses"];

const normaliseSettings = (settings = {}) => {
  const merged = { ...defaultFormSettings(), ...Object.fromEntries(SETTING_KEYS.filter((key) => settings[key] !== undefined).map((key) => [key, settings[key]])) };
  merged.submitLabel = String(merged.submitLabel || "Submit").slice(0, 60);
  merged.successMessage = String(merged.successMessage || "").slice(0, 1000);
  merged.requireLogin = Boolean(merged.requireLogin);
  merged.allowMultiple = Boolean(merged.allowMultiple);
  merged.closed = Boolean(merged.closed);
  const statuses = Array.isArray(merged.statuses)
    ? [...new Set(merged.statuses.map((status) => String(status).trim().toLowerCase().replace(/\s+/g, "-").slice(0, 40)).filter(Boolean))]
    : [];
  merged.statuses = statuses.length ? statuses.slice(0, 12) : [...DEFAULT_SUBMISSION_STATUSES];
  return merged;
};

export const saveFormDraft = async (form, { schema, settings, revision }, actor) => {
  if (revision !== undefined && Number(revision) !== form.revision) {
    throw conflict("Someone else saved this form since you opened it. Reload to get their changes.", { currentRevision: form.revision });
  }
  const $set = { updatedBy: toActor(actor), dirty: true };
  if (schema !== undefined) {
    const clean = cleanJson(schema);
    if (!clean || !Array.isArray(clean.fields)) throw badRequest("Form schema must contain a list of fields.");
    const blocking = validateSchemaDefinition(clean.fields).filter((problem) => /Unknown field type|nested|at most|\bid\b/i.test(problem.message));
    if (blocking.length) throw badRequest("The form schema is invalid.", { problems: blocking.map((problem) => problem.message) });
    $set["draft.schema"] = clean;
  }
  if (settings !== undefined) $set["draft.settings"] = normaliseSettings(cleanJson(settings));

  const updated = await Form.findOneAndUpdate({ _id: form._id, revision: form.revision }, { $set, $inc: { revision: 1 } }, { new: true });
  if (!updated) throw conflict("This form changed while you were saving. Reload and try again.");
  return updated;
};

export const formPublishImpact = (form) => {
  const diff = diffSchemas(form.published?.schema?.fields || [], form.draft?.schema?.fields || []);
  return {
    publishedVersion: form.published?.version || 0,
    added: diff.added.map(({ id, label, type }) => ({ id, label, type })),
    removed: diff.removed.map(({ id, label, key }) => ({ id, label, key })),
    typeChanged: diff.typeChanged,
    keyChanged: diff.keyChanged,
    becameRequired: diff.becameRequired.map(({ id, label }) => ({ id, label })),
    blocking: diff.keyChanged.length ? ["Keys of published fields can't change — existing responses are stored under the old key."] : [],
  };
};

export const publishForm = async (form, { actor, note = "" }) => {
  const fields = form.draft?.schema?.fields || [];
  const problems = validateSchemaDefinition(fields);
  if (problems.length) throw badRequest("The form has problems.", { problems: problems.map((problem) => problem.message) });
  if (!flattenFields(fields).some(({ field }) => fieldHasValue(field))) throw badRequest("Add at least one field before publishing.");
  const impact = formPublishImpact(form);
  if (impact.blocking.length) throw new HttpError(409, impact.blocking[0], { impact });

  const version = (form.published?.version || 0) + 1;
  const settings = normaliseSettings(form.draft?.settings);
  await SchemaVersion.create({
    ownerType: "form",
    ownerId: form._id,
    kind: "form",
    version,
    schema: { fields, settings },
    note,
    publishedBy: toActor(actor),
  });
  const updated = await Form.findByIdAndUpdate(
    form._id,
    {
      $set: {
        published: { version, schema: { fields }, settings, publishedAt: new Date(), publishedBy: toActor(actor) },
        status: form.status === "archived" ? "archived" : "published",
        dirty: false,
        updatedBy: toActor(actor),
      },
      $inc: { revision: 1 },
    },
    { new: true },
  );
  await emit("schema.updated", { formId: String(updated._id), formSlug: updated.slug, kind: "responseForm", version });
  return updated;
};

export const restoreFormVersion = async (form, version, actor) => {
  const doc = await SchemaVersion.findOne({ ownerType: "form", ownerId: form._id, version: Number(version) }).lean();
  if (!doc) throw new HttpError(404, "Version not found.");
  return Form.findByIdAndUpdate(
    form._id,
    {
      $set: {
        "draft.schema": { fields: doc.schema.fields || [] },
        "draft.settings": normaliseSettings(doc.schema.settings),
        dirty: true,
        updatedBy: toActor(actor),
      },
      $inc: { revision: 1 },
    },
    { new: true },
  );
};

export { normaliseSettings as normaliseFormSettings };
