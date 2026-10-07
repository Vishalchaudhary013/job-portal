import Form from "../../models/Form.js";
import SchemaVersion from "../../models/SchemaVersion.js";
import Submission from "../../models/Submission.js";
import { toActor } from "../../models/common.js";
import { referenceableFields } from "../../shared/schemaUtils.js";
import { audit } from "../../services/audit.js";
import { emit } from "../../services/events.js";
import { badRequest, escapeRegex, isObjectId, notFound, paginated, parsePagination } from "../../utils/http.js";

const buildFilter = (query) => {
  const filter = {};
  if (isObjectId(query.formId)) filter.formId = query.formId;
  if (isObjectId(query.contentId)) filter.contentId = query.contentId;
  if (isObjectId(query.contentTypeId)) filter.contentTypeId = query.contentTypeId;
  if (query.status) filter.status = String(query.status).slice(0, 40);
  if (query.userId) filter.userId = String(query.userId).slice(0, 40);
  if (query.source) filter.source = String(query.source).slice(0, 60);
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from && !Number.isNaN(Date.parse(query.from))) filter.createdAt.$gte = new Date(query.from);
    if (query.to && !Number.isNaN(Date.parse(query.to))) filter.createdAt.$lte = new Date(new Date(query.to).getTime() + 864e5 - 1);
  }
  if (query.q) {
    const regex = new RegExp(escapeRegex(String(query.q).slice(0, 100)), "i");
    filter.$or = [{ searchText: regex }, { userEmail: regex }, { userName: regex }, { contentTitle: regex }];
  }
  return filter;
};

export const listSubmissions = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = buildFilter(req.query);
  const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Submission.find(filter).select("-data -history -searchText").sort(sort).skip(skip).limit(limit).lean(),
    Submission.countDocuments(filter),
  ]);
  const forms = await Form.find({ _id: { $in: [...new Set(items.map((item) => String(item.formId)))] } }).select("name slug").lean();
  const formMap = Object.fromEntries(forms.map((form) => [String(form._id), { id: String(form._id), name: form.name, slug: form.slug }]));
  res.json(
    paginated(
      items.map((item) => ({ ...item, id: String(item._id), noteCount: item.notes?.length || 0, notes: undefined, form: formMap[String(item.formId)] || null })),
      total,
      { page, limit },
    ),
  );
};

// The schema the response was submitted against — labels stay correct even
// after the form changes.
const schemaForSubmission = async (submission) => {
  const version = await SchemaVersion.findOne({ ownerType: "form", ownerId: submission.formId, version: submission.formVersion }).lean();
  return version?.schema?.fields || [];
};

export const getSubmission = async (req, res) => {
  const submission = await Submission.findById(req.params.id).lean();
  if (!submission) throw notFound("Submission");
  const form = await Form.findById(submission.formId).select("name slug published.settings.statuses draft.settings.statuses").lean();
  res.json({
    submission: { ...submission, id: String(submission._id) },
    form: form ? { id: String(form._id), name: form.name, slug: form.slug, statuses: form.published?.settings?.statuses || form.draft?.settings?.statuses || [] } : null,
    fields: await schemaForSubmission(submission),
  });
};

const applyStatus = async (req, submission, status) => {
  const form = await Form.findById(submission.formId).select("published.settings.statuses draft.settings.statuses").lean();
  const allowed = form?.published?.settings?.statuses || form?.draft?.settings?.statuses || [];
  if (allowed.length && !allowed.includes(status)) throw badRequest(`"${status}" is not a status of this form.`);
  if (submission.status === status) return false;
  submission.history.push({ action: "status", from: submission.status, to: status, by: toActor(req.cmsUser), at: new Date() });
  submission.status = status;
  await submission.save();
  await emit("submission.updated", { submissionId: String(submission._id), formId: String(submission.formId), formSlug: submission.formSlug, status, userId: submission.userId, contentId: submission.contentId ? String(submission.contentId) : null });
  return true;
};

export const updateSubmissionStatus = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) throw notFound("Submission");
  const status = String(req.body?.status || "").trim();
  if (!status) throw badRequest("Choose a status.");
  const from = submission.status;
  if (await applyStatus(req, submission, status)) {
    await audit(req, { action: "submission.statusChanged", entityType: "submission", entityId: submission._id, entityLabel: submission.formSlug, details: { from, to: status } });
  }
  res.json({ submission: { ...submission.toObject(), id: String(submission._id) } });
};

export const bulkUpdateSubmissionStatus = async (req, res) => {
  const ids = (Array.isArray(req.body?.ids) ? req.body.ids : []).filter(isObjectId).slice(0, 200);
  const status = String(req.body?.status || "").trim();
  if (!ids.length || !status) throw badRequest("Choose responses and a status.");
  let changed = 0;
  for (const id of ids) {
    const submission = await Submission.findById(id);
    if (submission && (await applyStatus(req, submission, status))) changed += 1;
  }
  await audit(req, { action: "submission.bulkStatusChanged", entityType: "submission", details: { count: changed, status } });
  res.json({ changed });
};

export const addSubmissionNote = async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) throw notFound("Submission");
  const text = String(req.body?.text || "").trim();
  if (!text) throw badRequest("Write a note first.");
  submission.notes.push({ text: text.slice(0, 4000), author: toActor(req.cmsUser) });
  submission.history.push({ action: "note", by: toActor(req.cmsUser), at: new Date() });
  await submission.save();
  await audit(req, { action: "submission.noteAdded", entityType: "submission", entityId: submission._id, entityLabel: submission.formSlug });
  res.status(201).json({ submission: { ...submission.toObject(), id: String(submission._id) } });
};

export const deleteSubmission = async (req, res) => {
  const submission = await Submission.findByIdAndDelete(req.params.id);
  if (!submission) throw notFound("Submission");
  await audit(req, { action: "submission.deleted", entityType: "submission", entityId: submission._id, entityLabel: submission.formSlug, details: { userId: submission.userId } });
  res.json({ ok: true });
};

// CSV export

const csvCell = (value) => {
  let text;
  if (value == null) text = "";
  else if (Array.isArray(value)) text = value.map((item) => (item && typeof item === "object" ? item.name || item.url || JSON.stringify(item) : String(item))).join("; ");
  else if (typeof value === "object") text = value.url || value.name || JSON.stringify(value);
  else text = String(value);
  text = text.replace(/<[^>]*>/g, " ");
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportSubmissions = async (req, res) => {
  if (!isObjectId(req.query.formId)) throw badRequest("Choose a form to export.");
  const form = await Form.findById(req.query.formId).lean();
  if (!form) throw notFound("Form");
  const fields = referenceableFields(form.published?.schema?.fields || form.draft?.schema?.fields || []);
  const submissions = await Submission.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(10000).lean();

  const header = ["Submitted at", "Status", "User ID", "User email", "User name", "Content", "Source", "Form version", ...fields.map((field) => field.label || field.key)];
  const rows = submissions.map((submission) => [
    submission.createdAt?.toISOString(),
    submission.status,
    submission.userId,
    submission.userEmail,
    submission.userName,
    submission.contentTitle,
    submission.source,
    submission.formVersion,
    ...fields.map((field) => field.path.split(".").reduce((acc, part) => acc?.[part], submission.data)),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  await audit(req, { action: "submission.exported", entityType: "form", entityId: form._id, entityLabel: form.name, details: { count: submissions.length } });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${form.slug}-responses-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${csv}`);
};
