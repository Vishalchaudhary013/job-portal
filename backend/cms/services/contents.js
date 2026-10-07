import Content from "../models/Content.js";
import ContentVersion from "../models/ContentVersion.js";
import { toActor } from "../models/common.js";
import { toSlug } from "../shared/ids.js";
import { getByPath, referenceableFields } from "../shared/schemaUtils.js";
import { collectMediaRefs, validateData } from "../shared/validation.js";
import { HttpError, badRequest, conflict, escapeRegex } from "../utils/http.js";
import { defaultConfig, draftConfig, editorFormSchema, getPublishedConfig } from "./contentTypes.js";
import { emit } from "./events.js";
import { sanitizeEntryData } from "./sanitize.js";
import { getSystemSettings } from "./settings.js";

// Title / slug

const presentationOf = (contentType) => ({ ...defaultConfig("presentation"), ...draftConfig(contentType, "presentation") });

const valueAsText = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(valueAsText).filter(Boolean).join(", ");
  return "";
};

export const deriveTitle = (contentType, fields, data) => {
  const refs = referenceableFields(fields);
  const presentation = presentationOf(contentType);
  const chosen = refs.find((ref) => ref.id === presentation.titleFieldId);
  const firstText = refs.find((ref) => ["text", "textarea", "email", "select", "radio", "number"].includes(ref.type));
  const title = valueAsText(getByPath(data, (chosen || firstText)?.path));
  return title.slice(0, 300) || "Untitled";
};

// const deriveSlugBase = (contentType, fields, data, title) => {
//   const refs = referenceableFields(fields);
//   const slugField = refs.find((ref) => ref.id === presentationOf(contentType).slugFieldId);
//   return toSlug(slugField ? valueAsText(getByPath(data, slugField.path)) : title) || "entry";
// };
// The URL is always generated from the title: lowercase, spaces and symbols
// become "-" (e.g. "Frontend Developer (React)" -> "frontend-developer-react").
const deriveSlugBase = (contentType, fields, data, title) => toSlug(title) || "entry";

export const uniqueSlug = async (contentTypeId, base, excludeId = null) => {
  const pattern = new RegExp(`^${escapeRegex(base)}(?:-(\\d+))?$`);
  const taken = await Content.find({ contentTypeId, slug: pattern, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    .select("slug")
    .lean();
  if (!taken.some((doc) => doc.slug === base)) return base;
  const numbers = taken.map((doc) => Number(doc.slug.match(pattern)?.[1] || 1));
  return `${base}-${Math.max(...numbers) + 1}`;
};

const formatErrors = (errors) => ({ fieldErrors: errors });

// Draft writes

export const createEntry = async (contentType, { data, slug }, actor) => {
  const schema = await editorFormSchema(contentType);
  const clean = sanitizeEntryData(schema.fields, data);
  const { valid, errors } = validateData(schema.fields, clean, { enforceRequired: false });
  if (!valid) throw badRequest("Some values are invalid.", formatErrors(errors));

  const title = deriveTitle(contentType, schema.fields, clean);
  // const finalSlug = await uniqueSlug(contentType._id, toSlug(slug) || deriveSlugBase(contentType, schema.fields, clean, title));
  // URLs are always generated from the title; a slug sent by the client is ignored.
  void slug;
  const finalSlug = await uniqueSlug(contentType._id, deriveSlugBase(contentType, schema.fields, clean, title));
  const entry = await Content.create({
    contentTypeId: contentType._id,
    slug: finalSlug,
    // slugCustom: Boolean(toSlug(slug)),
    slugCustom: false,
    title,
    status: "draft",
    draft: { data: clean, formRevision: contentType.revision },
    mediaIds: collectMediaRefs(schema.fields, clean),
    createdBy: toActor(actor),
    updatedBy: toActor(actor),
  });
  await emit("content.created", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, contentId: String(entry._id), slug: entry.slug });
  return entry;
};

export const saveEntryDraft = async (contentType, entry, { data, slug, revision }, actor) => {
  if (revision !== undefined && Number(revision) !== entry.revision) {
    throw conflict("This entry was changed by someone else since you opened it. Reload to see their changes.", {
      currentRevision: entry.revision,
      updatedBy: entry.updatedBy,
    });
  }
  if (entry.status === "archived") throw badRequest("Restore this entry before editing it.");

  const schema = await editorFormSchema(contentType);
  const clean = sanitizeEntryData(schema.fields, data, entry.draft?.data);
  const { valid, errors } = validateData(schema.fields, clean, { enforceRequired: false });
  if (!valid) throw badRequest("Some values are invalid.", formatErrors(errors));

  const title = deriveTitle(contentType, schema.fields, clean);
  // const nextSlug = slug !== undefined && toSlug(slug) ? await uniqueSlug(contentType._id, toSlug(slug), entry._id) : entry.slug;
  let nextSlug = entry.slug;
  // let slugCustom = Boolean(entry.slugCustom);
  // if (slug !== undefined && toSlug(slug) && toSlug(slug) !== entry.slug) {
  //   nextSlug = await uniqueSlug(contentType._id, toSlug(slug), entry._id);
  //   slugCustom = true;
  // } else if (!slugCustom && !entry.published) {
  // Admin-typed slugs are no longer accepted: the URL comes from the title.
  void slug;
  const slugCustom = false;
  if (!entry.published) {
    // Never published and never set by hand: keep the slug in step with the title.
    const base = deriveSlugBase(contentType, schema.fields, clean, title);
    if (base !== entry.slug.replace(/-\d+$/, "")) nextSlug = await uniqueSlug(contentType._id, base, entry._id);
  }

  const updated = await Content.findOneAndUpdate(
    { _id: entry._id, revision: entry.revision },
    {
      $set: {
        "draft.data": clean,
        "draft.formRevision": contentType.revision,
        title,
        slug: nextSlug,
        slugCustom,
        hasUnpublishedChanges: true,
        mediaIds: collectMediaRefs(schema.fields, clean),
        updatedBy: toActor(actor),
        // An edited entry that was waiting for review goes back to draft.
        ...(entry.status === "review" ? { status: "draft" } : {}),
      },
      $inc: { revision: 1 },
    },
    { new: true },
  );
  if (!updated) throw conflict("This entry changed while you were saving. Reload and try again.");
  await emit("content.updated", { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, contentId: String(entry._id), slug: updated.slug });
  return updated;
};

// Status transitions

const requirePublishedForm = async (contentType) => {
  const form = await getPublishedConfig(contentType, "form");
  if (!form) throw badRequest("Publish this content type's form before publishing entries.");
  return form;
};

const validateForPublish = async (contentType, entry) => {
  const form = await requirePublishedForm(contentType);
  const data = sanitizeEntryData(form.fields, entry.draft?.data || {}, entry.draft?.data);
  const { valid, errors } = validateData(form.fields, data, { enforceRequired: true });
  if (!valid) throw badRequest("Complete the highlighted fields before continuing.", formatErrors(errors));
  return { form, data };
};

export const transitionEntry = async (contentType, entry, action, { actor, note = "" }) => {
  const base = { contentTypeId: String(contentType._id), contentTypeSlug: contentType.slug, contentId: String(entry._id), slug: entry.slug };

  switch (action) {
    case "submitReview": {
      if (!["draft", "unpublished", "published"].includes(entry.status)) throw badRequest("Only drafts can be sent for review.");
      await validateForPublish(contentType, entry);
      entry.status = "review";
      entry.reviewNote = note;
      entry.updatedBy = toActor(actor);
      await entry.save();
      return { entry, event: null };
    }

    case "publish": {
      if (entry.status === "archived") throw badRequest("Restore this entry before publishing it.");
      const { requireReview } = await getSystemSettings();
      if (requireReview && entry.status !== "review" && entry.status !== "published" && actor.role !== "super_admin") {
        throw badRequest("Entries must be reviewed before publishing. Send it for review first.");
      }
      const { data } = await validateForPublish(contentType, entry);
      const version = entry.version + 1;
      const now = new Date();
      const publishedForm = contentType.published.form.version;

      await ContentVersion.create({
        contentId: entry._id,
        contentTypeId: contentType._id,
        version,
        slug: entry.slug,
        title: entry.title,
        data,
        formVersion: publishedForm,
        note,
        createdBy: toActor(actor),
      });

      const previousSlug = entry.published?.slug;
      entry.published = { data, slug: entry.slug, title: entry.title, formVersion: publishedForm, version, publishedAt: now, publishedBy: toActor(actor) };
      entry.version = version;
      entry.status = "published";
      entry.hasUnpublishedChanges = false;
      entry.reviewNote = "";
      entry.updatedBy = toActor(actor);
      entry.revision += 1;
      await entry.save();
      return { entry, event: ["content.published", { ...base, version, ...(previousSlug && previousSlug !== entry.slug ? { previousSlug } : {}) }] };
    }

    case "unpublish": {
      if (entry.status !== "published") throw badRequest("Only published entries can be unpublished.");
      entry.status = "unpublished";
      entry.updatedBy = toActor(actor);
      await entry.save();
      return { entry, event: ["content.unpublished", { ...base, slug: entry.published?.slug || entry.slug }] };
    }

    case "archive": {
      if (entry.status === "archived") return { entry, event: null };
      const wasLive = entry.status === "published";
      entry.status = "archived";
      entry.updatedBy = toActor(actor);
      await entry.save();
      return { entry, event: ["content.archived", { ...base, wasLive }] };
    }

    case "restore": {
      if (entry.status !== "archived") throw badRequest("Only archived entries can be restored.");
      entry.status = "draft";
      entry.updatedBy = toActor(actor);
      await entry.save();
      return { entry, event: null };
    }

    case "discardChanges": {
      if (!entry.published) throw badRequest("This entry has never been published — there's nothing to revert to.");
      entry.draft = { data: entry.published.data, formRevision: contentType.revision };
      entry.slug = entry.published.slug || entry.slug;
      entry.title = entry.published.title || entry.title;
      entry.hasUnpublishedChanges = false;
      if (entry.status === "review") entry.status = "published";
      entry.updatedBy = toActor(actor);
      entry.revision += 1;
      await entry.save();
      return { entry, event: null };
    }

    default:
      throw badRequest(`Unknown action "${action}".`);
  }
};

export const runTransition = async (contentType, entry, action, options) => {
  const result = await transitionEntry(contentType, entry, action, options);
  if (result.event) await emit(...result.event);
  return result.entry;
};

export const restoreEntryVersion = async (contentType, entry, version, actor) => {
  const snapshot = await ContentVersion.findOne({ contentId: entry._id, version: Number(version) }).lean();
  if (!snapshot) throw new HttpError(404, "Version not found.");
  entry.draft = { data: snapshot.data, formRevision: contentType.revision };
  entry.title = snapshot.title || entry.title;
  entry.hasUnpublishedChanges = true;
  entry.updatedBy = toActor(actor);
  entry.revision += 1;
  await entry.save();
  return entry;
};
