import Content from "../models/Content.js";
import Form from "../models/Form.js";
import Submission from "../models/Submission.js";
import { validateData } from "../shared/validation.js";
import { HttpError, badRequest, cleanJson, isObjectId } from "../utils/http.js";
import { emit } from "./events.js";
import { sanitizeEntryData } from "./sanitize.js";

const flattenText = (value, out = []) => {
  if (out.join(" ").length > 5000) return out;
  if (value == null) return out;
  if (typeof value === "string") out.push(value.replace(/<[^>]*>/g, " "));
  else if (typeof value === "number" || typeof value === "boolean") out.push(String(value));
  else if (Array.isArray(value)) value.forEach((item) => flattenText(item, out));
  else if (typeof value === "object") Object.entries(value).forEach(([key, item]) => key !== "url" && key !== "id" && flattenText(item, out));
  return out;
};

const CONTEXT_KEYS = ["source", "pageUrl", "referrer", "locale", "userAgent"];

// Creates a submission against the PUBLISHED version of a form.
//   user: { id, email, name } as verified by the caller (the portal's own
//         session, or an external consumer authenticated with an API key).
export const createSubmission = async ({ slug, data, user = null, contentId = null, source = "edeco", context = {} }) => {
  const form = await Form.findOne({ slug: String(slug || "").toLowerCase(), status: "published" }).lean();
  if (!form?.published?.version) throw new HttpError(404, "Form not found.");
  const settings = form.published.settings || {};
  if (settings.closed) throw new HttpError(410, "This form is no longer accepting responses.");
  if (settings.requireLogin !== false && !user?.id) throw new HttpError(401, "Please sign in to submit this form.");

  let entry = null;
  if (contentId) {
    if (!isObjectId(contentId)) throw badRequest("Invalid content reference.");
    entry = await Content.findOne({ _id: contentId, status: "published" }).select("contentTypeId published.title title").lean();
    if (!entry) throw badRequest("The item this form belongs to is not available.");
  }

  if (!settings.allowMultiple && user?.id) {
    const exists = await Submission.exists({ formId: form._id, userId: String(user.id), contentId: entry?._id || null });
    if (exists) throw new HttpError(409, "You have already submitted this form.");
  }

  const fields = form.published.schema?.fields || [];
  const clean = sanitizeEntryData(fields, data);
  const { valid, errors } = validateData(fields, clean, { enforceRequired: true });
  if (!valid) throw badRequest("Please fix the highlighted fields.", { fieldErrors: errors });

  const safeContext = cleanJson(Object.fromEntries(CONTEXT_KEYS.filter((key) => context?.[key] !== undefined).map((key) => [key, String(context[key]).slice(0, 500)])));
  const statuses = settings.statuses?.length ? settings.statuses : ["new"];

  const submission = await Submission.create({
    formId: form._id,
    formSlug: form.slug,
    formVersion: form.published.version,
    contentTypeId: entry?.contentTypeId || null,
    contentId: entry?._id || null,
    contentTitle: entry?.published?.title || entry?.title || "",
    data: clean,
    searchText: flattenText(clean).join(" ").slice(0, 5000),
    userId: user?.id ? String(user.id) : null,
    userEmail: user?.email || "",
    userName: user?.name || "",
    source: String(source || "edeco").slice(0, 60),
    context: { ...safeContext, submittedAt: new Date().toISOString() },
    status: statuses[0],
    history: [{ action: "created", to: statuses[0], by: user?.id ? { id: String(user.id), name: user.name || "", email: user.email || "", role: "user" } : null }],
  });

  await emit("submission.created", {
    submissionId: String(submission._id),
    formId: String(form._id),
    formSlug: form.slug,
    contentId: submission.contentId ? String(submission.contentId) : null,
    contentTypeId: submission.contentTypeId ? String(submission.contentTypeId) : null,
    userId: submission.userId,
    source: submission.source,
  });

  return { submission, successMessage: settings.successMessage || "Thanks — your response has been recorded." };
};

// Field definition for an upload targeted at a specific file/image field.
export const findUploadField = async (slug, fieldId) => {
  const form = await Form.findOne({ slug: String(slug || "").toLowerCase(), status: "published" }).lean();
  if (!form?.published?.version) throw new HttpError(404, "Form not found.");
  if (form.published.settings?.closed) throw new HttpError(410, "This form is no longer accepting responses.");
  const stack = [...(form.published.schema?.fields || [])];
  while (stack.length) {
    const field = stack.shift();
    if (field.id === fieldId && ["file", "image"].includes(field.type)) return { form, field };
    if (Array.isArray(field.children)) stack.push(...field.children);
  }
  throw badRequest("That field doesn't accept uploads.");
};
