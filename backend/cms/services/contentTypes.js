import ContentType from "../models/ContentType.js";
import Content from "../models/Content.js";
import SchemaVersion from "../models/SchemaVersion.js";
import { CONFIG_KINDS, toActor } from "../models/common.js";
import { fieldHasValue } from "../shared/fieldTypes.js";
import { diffSchemas, flattenFields, validateSchemaDefinition } from "../shared/schemaUtils.js";
import {
  createCardSchema,
  createPageSchema,
  createPresentationSettings,
  referencedFieldIds,
  validateCardSchema,
  validatePageSchema,
  validatePresentationSettings,
} from "../shared/presentation.js";
import { HttpError, badRequest, cleanJson, conflict } from "../utils/http.js";
import { CONFIG_EVENT, emit } from "./events.js";

// Content type configuration lifecycle: draft -> (preview) -> publish -> version.

export const defaultConfig = (kind) =>
  ({
    form: { fields: [] },
    card: createCardSchema(),
    page: createPageSchema(),
    presentation: createPresentationSettings(),
  })[kind];

export const draftConfig = (contentType, kind) => contentType.draft?.[kind] || defaultConfig(kind);

const validateConfig = (kind, value) => {
  if (kind === "form") {
    if (!value || !Array.isArray(value.fields)) return ["Form schema must contain a list of fields."];
    return validateSchemaDefinition(value.fields).map((problem) => problem.message);
  }
  if (kind === "card") return validateCardSchema(value);
  if (kind === "page") return validatePageSchema(value);
  if (kind === "presentation") return validatePresentationSettings(value);
  return ["Unknown configuration kind."];
};

export const getPublishedConfig = async (contentType, kind) => {
  const version = contentType.published?.[kind]?.version || 0;
  if (!version) return null;
  const doc = await SchemaVersion.findOne({ ownerType: "contentType", ownerId: contentType._id, kind, version }).lean();
  return doc?.schema || null;
};

// The form schema content is authored against: the published one once it
// exists (so draft form edits never leak into the live editor contract),
// otherwise the draft so admins can start entering content immediately.
export const editorFormSchema = async (contentType) =>
  (await getPublishedConfig(contentType, "form")) || draftConfig(contentType, "form");

// Saves one or more draft configurations with optimistic concurrency.
export const saveDrafts = async (contentType, patch, { revision, actor }) => {
  if (revision !== undefined && Number(revision) !== contentType.revision) {
    throw conflict("Someone else saved this content type since you opened it. Reload to get their changes.", {
      currentRevision: contentType.revision,
      updatedBy: contentType.updatedBy,
    });
  }

  const $set = {};
  const changedKinds = [];
  for (const kind of CONFIG_KINDS) {
    if (patch[kind] === undefined) continue;
    const value = cleanJson(patch[kind]);
    const problems = validateConfig(kind, value);
    // Form drafts may be temporarily incomplete while the admin is building
    // (e.g. a field without a label). Only structural problems block a save;
    // full validation happens at publish.
    const blocking = kind === "form" ? problems.filter((message) => /Unknown field type|nested|at most|\bid\b/i.test(message)) : problems;
    if (blocking.length) throw badRequest(`The ${kind} configuration is invalid.`, { problems: blocking });
    $set[`draft.${kind}`] = value;
    $set[`dirty.${kind}`] = true;
    changedKinds.push(kind);
  }
  if (!changedKinds.length) return { contentType, changedKinds };

  const updated = await ContentType.findOneAndUpdate(
    { _id: contentType._id, revision: contentType.revision },
    { $set: { ...$set, updatedBy: toActor(actor) }, $inc: { revision: 1 } },
    { new: true },
  );
  if (!updated) throw conflict("This content type changed while you were saving. Reload and try again.");
  return { contentType: updated, changedKinds };
};

// What publishing the current form draft would do to existing data/presentation.
export const publishImpact = async (contentType) => {
  const publishedForm = await getPublishedConfig(contentType, "form");
  const draftForm = draftConfig(contentType, "form");
  const diff = diffSchemas(publishedForm?.fields || [], draftForm.fields || []);
  const removedIds = new Set(diff.removed.map((field) => field.id));
  const referenced = referencedFieldIds(draftConfig(contentType, "card"), draftConfig(contentType, "page"));
  const orphanedReferences = [...referenced].filter((id) => removedIds.has(id));
  const entries = await Content.countDocuments({ contentTypeId: contentType._id });
  const published = await Content.countDocuments({ contentTypeId: contentType._id, status: "published" });

  return {
    formPublishedVersion: contentType.published?.form?.version || 0,
    added: diff.added.map(({ id, label, type }) => ({ id, label, type })),
    removed: diff.removed.map(({ id, label, key, type }) => ({ id, label, key, type })),
    typeChanged: diff.typeChanged,
    keyChanged: diff.keyChanged,
    becameRequired: diff.becameRequired.map(({ id, label }) => ({ id, label })),
    orphanedReferences,
    entries,
    publishedEntries: published,
    blocking: diff.keyChanged.length
      ? ["Keys of fields that are already published can't be changed — existing content is stored under the old key. Add a new field instead."]
      : [],
  };
};

export const publishConfigs = async (contentType, kinds, { actor, note = "" }) => {
  const requested = CONFIG_KINDS.filter((kind) => kinds.includes(kind));
  if (!requested.length) throw badRequest("Choose what to publish: form, card, page or presentation.");

  const formPublishedAlready = (contentType.published?.form?.version || 0) > 0;
  if (!formPublishedAlready && !requested.includes("form") && requested.length) {
    throw badRequest("Publish the form first — cards and pages render against the published form.");
  }

  // Validate everything before writing anything.
  const snapshots = {};
  for (const kind of requested) {
    const value = draftConfig(contentType, kind);
    const problems = validateConfig(kind, value);
    if (problems.length) throw badRequest(`The ${kind} configuration has problems.`, { kind, problems });
    if (kind === "form") {
      if (!flattenFields(value.fields).some(({ field }) => fieldHasValue(field))) {
        throw badRequest("Add at least one field before publishing the form.");
      }
      const impact = await publishImpact(contentType);
      if (impact.blocking.length) throw new HttpError(409, impact.blocking[0], { impact });
    }
    snapshots[kind] = value;
  }

  const $set = {};
  const versions = {};
  for (const kind of requested) {
    const version = (contentType.published?.[kind]?.version || 0) + 1;
    await SchemaVersion.create({
      ownerType: "contentType",
      ownerId: contentType._id,
      kind,
      version,
      schema: snapshots[kind],
      note,
      publishedBy: toActor(actor),
    });
    $set[`published.${kind}`] = { version, publishedAt: new Date(), publishedBy: toActor(actor) };
    $set[`dirty.${kind}`] = false;
    versions[kind] = version;
  }

  const willHave = (kind) => versions[kind] || contentType.published?.[kind]?.version;
  if (contentType.status !== "archived" && willHave("form") && willHave("card") && willHave("page")) $set.status = "published";

  const updated = await ContentType.findByIdAndUpdate(
    contentType._id,
    { $set: { ...$set, updatedBy: toActor(actor) }, $inc: { revision: 1 } },
    { new: true },
  );

  for (const kind of requested) {
    await emit(CONFIG_EVENT[kind], { contentTypeId: String(updated._id), contentTypeSlug: updated.slug, kind, version: versions[kind] });
  }
  return { contentType: updated, versions };
};

export const restoreConfigVersion = async (contentType, kind, version, { actor }) => {
  const doc = await SchemaVersion.findOne({ ownerType: "contentType", ownerId: contentType._id, kind, version: Number(version) }).lean();
  if (!doc) throw new HttpError(404, "Version not found.");
  return ContentType.findByIdAndUpdate(
    contentType._id,
    { $set: { [`draft.${kind}`]: doc.schema, [`dirty.${kind}`]: true, updatedBy: toActor(actor) }, $inc: { revision: 1 } },
    { new: true },
  );
};

// Published configuration bundle for delivery (Edeco rendering).
export const getPublishedBundle = async (contentType) => {
  const [form, card, page, presentation] = await Promise.all(CONFIG_KINDS.map((kind) => getPublishedConfig(contentType, kind)));
  return {
    form,
    card: card || defaultConfig("card"),
    page: page || defaultConfig("page"),
    presentation: { ...defaultConfig("presentation"), ...(presentation || {}), listing: { ...defaultConfig("presentation").listing, ...(presentation?.listing || {}) } },
    versions: Object.fromEntries(CONFIG_KINDS.map((kind) => [kind, contentType.published?.[kind]?.version || 0])),
  };
};

// Draft bundle (preview only).
export const getDraftBundle = (contentType) => ({
  form: draftConfig(contentType, "form"),
  card: draftConfig(contentType, "card"),
  page: draftConfig(contentType, "page"),
  presentation: { ...defaultConfig("presentation"), ...draftConfig(contentType, "presentation") },
  versions: { draft: contentType.revision },
});
