import User from "../../../models/userModel.js";
import AdminAccess from "../../models/AdminAccess.js";
import ApiKey, { API_SCOPES } from "../../models/ApiKey.js";
import AuditLog from "../../models/AuditLog.js";
import Content from "../../models/Content.js";
import ContentType from "../../models/ContentType.js";
import Form from "../../models/Form.js";
import Media from "../../models/Media.js";
import Submission from "../../models/Submission.js";
import { WEBHOOK_EVENTS, WebhookDelivery, WebhookEndpoint } from "../../models/Webhook.js";
import { toActor } from "../../models/common.js";
import { generateApiKey, hashApiKey } from "../../middleware/apiKey.js";
import { audit } from "../../services/audit.js";
import { getSystemSettings, updateSystemSettings } from "../../services/settings.js";
import { redeliver } from "../../services/webhooks.js";
import { HttpError, badRequest, escapeRegex, isObjectId, notFound, paginated, parsePagination } from "../../utils/http.js";
import { ALL_GRANTABLE, PERMISSIONS, PERMISSION_PRESETS, sanitizePermissions } from "../../utils/permissions.js";

// Session

export const getMe = (req, res) => {
  res.json({ user: req.cmsUser });
};

// Dashboard / analytics

export const getDashboard = async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [types, contentByStatus, formsCount, submissionsTotal, submissionsNew, submissionsWeek, recentActivity, recentSubmissions, mediaCount] = await Promise.all([
    ContentType.find({ status: { $ne: "archived" } }).select("name slug icon status dirty updatedAt").sort({ updatedAt: -1 }).limit(8).lean(),
    Content.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Form.countDocuments({ status: { $ne: "archived" } }),
    Submission.countDocuments({}),
    Submission.countDocuments({ status: "new" }),
    Submission.countDocuments({ createdAt: { $gte: weekAgo } }),
    req.cmsUser.permissions.includes("audit.read") ? AuditLog.find({}).sort({ createdAt: -1 }).limit(10).lean() : AuditLog.find({ "actor.id": req.cmsUser.id }).sort({ createdAt: -1 }).limit(10).lean(),
    req.cmsUser.permissions.includes("submissions.read")
      ? Submission.find({}).select("formSlug contentTitle userName userEmail status createdAt").sort({ createdAt: -1 }).limit(6).lean()
      : [],
    Media.countDocuments({ source: "library" }),
  ]);
  const content = Object.fromEntries(contentByStatus.map((row) => [row._id, row.count]));
  res.json({
    counts: {
      contentTypes: await ContentType.countDocuments({ status: { $ne: "archived" } }),
      content: { total: Object.values(content).reduce((a, b) => a + b, 0), ...content },
      forms: formsCount,
      submissions: { total: submissionsTotal, new: submissionsNew, last7Days: submissionsWeek },
      media: mediaCount,
    },
    contentTypes: types.map((type) => ({ ...type, id: String(type._id) })),
    recentActivity,
    recentSubmissions: recentSubmissions.map((item) => ({ ...item, id: String(item._id) })),
  });
};

export const getAnalytics = async (req, res) => {
  const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));
  const since = new Date(Date.now() - days * 864e5);
  const [perDay, byForm, byStatus, contentByType, contentByStatus, publishesPerDay] = await Promise.all([
    Submission.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Submission.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$formSlug", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Submission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Content.aggregate([
      { $group: { _id: "$contentTypeId", total: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } } } },
      { $lookup: { from: "cms_content_types", localField: "_id", foreignField: "_id", as: "type" } },
      { $project: { total: 1, published: 1, name: { $ifNull: [{ $first: "$type.name" }, "Deleted type"] } } },
      { $sort: { total: -1 } },
    ]),
    Content.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    AuditLog.aggregate([
      { $match: { action: "content.publish", createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Fill gaps so charts get one point per day.
  const series = (rows) => {
    const map = Object.fromEntries(rows.map((row) => [row._id, row.count]));
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(Date.now() - (days - 1 - index) * 864e5).toISOString().slice(0, 10);
      return { date, count: map[date] || 0 };
    });
  };

  res.json({
    days,
    submissionsPerDay: series(perDay),
    publishesPerDay: series(publishesPerDay),
    submissionsByForm: byForm.map((row) => ({ form: row._id, count: row.count })),
    submissionsByStatus: byStatus.map((row) => ({ status: row._id, count: row.count })),
    contentByType: contentByType.map((row) => ({ id: String(row._id), name: row.name, total: row.total, published: row.published })),
    contentByStatus: contentByStatus.map((row) => ({ status: row._id, count: row.count })),
  });
};

// Admins & permissions (super admin)

export const getPermissionCatalog = (req, res) => {
  res.json({ permissions: PERMISSIONS, presets: PERMISSION_PRESETS });
};

// Admin identities are read from Edeco's user records (read-only). Edeco stays
// the source of truth for who is an admin; here we only manage Form Builder access.
export const listAdmins = async (req, res) => {
  const users = await User.find({ role: { $in: ["admin", "super_admin"] } })
    .select("_id fullName email role adminApprovalStatus createdAt")
    .sort({ role: -1, fullName: 1 })
    .lean();
  const access = await AdminAccess.find({ userId: { $in: users.map((user) => String(user._id)) } }).lean();
  const accessMap = Object.fromEntries(access.map((item) => [item.userId, item]));
  const { defaultAdminAccess } = await getSystemSettings();

  res.json({
    defaultAccess: defaultAdminAccess,
    items: users.map((user) => {
      const record = accessMap[String(user._id)];
      const isSuper = user.role === "super_admin";
      return {
        id: String(user._id),
        name: user.fullName,
        email: user.email,
        role: user.role,
        approval: user.adminApprovalStatus || "approved",
        joinedAt: user.createdAt,
        usesDefault: !record && !isSuper,
        enabled: isSuper ? true : record ? record.enabled : Boolean(defaultAdminAccess?.enabled),
        permissions: isSuper ? ALL_GRANTABLE : sanitizePermissions(record ? record.permissions : defaultAdminAccess?.permissions),
        updatedAt: record?.updatedAt || null,
      };
    }),
  });
};

export const updateAdminAccess = async (req, res) => {
  const userId = String(req.params.userId);
  if (!isObjectId(userId)) throw badRequest("Invalid admin id.");
  const user = await User.findById(userId).select("_id fullName email role").lean();
  if (!user || !["admin", "super_admin"].includes(user.role)) throw notFound("Admin");
  if (user.role === "super_admin") throw badRequest("The super admin always has full access.");

  if (req.body?.useDefault) {
    await AdminAccess.deleteOne({ userId });
  } else {
    await AdminAccess.updateOne(
      { userId },
      {
        $set: {
          email: user.email,
          name: user.fullName,
          enabled: req.body?.enabled !== false,
          permissions: sanitizePermissions(req.body?.permissions),
          updatedBy: toActor(req.cmsUser),
        },
      },
      { upsert: true },
    );
  }
  await audit(req, {
    action: "admin.accessUpdated",
    entityType: "admin",
    entityId: userId,
    entityLabel: user.fullName || user.email,
    details: req.body?.useDefault ? { useDefault: true } : { enabled: req.body?.enabled !== false, permissions: sanitizePermissions(req.body?.permissions) },
  });
  res.json({ ok: true });
};

// Audit logs

export const listAuditLogs = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
  const filter = {};
  if (req.query.entityType) filter.entityType = String(req.query.entityType).slice(0, 40);
  if (req.query.entityId) filter.entityId = String(req.query.entityId).slice(0, 40);
  if (req.query.actorId) filter["actor.id"] = String(req.query.actorId).slice(0, 40);
  if (req.query.action) filter.action = new RegExp(`^${escapeRegex(String(req.query.action).slice(0, 60))}`);
  if (req.query.q) {
    const regex = new RegExp(escapeRegex(String(req.query.q).slice(0, 100)), "i");
    filter.$or = [{ entityLabel: regex }, { "actor.name": regex }, { "actor.email": regex }, { action: regex }];
  }
  const [items, total] = await Promise.all([AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(filter)]);
  res.json(paginated(items, total, { page, limit }));
};

// System settings

export const getSettings = async (req, res) => {
  res.json({ settings: await getSystemSettings() });
};

export const updateSettings = async (req, res) => {
  const patch = {};
  if (req.body?.defaultAdminAccess) {
    patch.defaultAdminAccess = {
      enabled: req.body.defaultAdminAccess.enabled !== false,
      permissions: sanitizePermissions(req.body.defaultAdminAccess.permissions),
    };
  }
  if (req.body?.requireReview !== undefined) patch.requireReview = Boolean(req.body.requireReview);
  const settings = await updateSystemSettings(patch);
  await audit(req, { action: "settings.updated", entityType: "settings", details: patch });
  res.json({ settings });
};

// API keys

export const listApiKeys = async (req, res) => {
  const items = await ApiKey.find({}).sort({ createdAt: -1 }).lean();
  res.json({ items: items.map((item) => ({ ...item, id: String(item._id) })), scopes: API_SCOPES });
};

export const createApiKey = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) throw badRequest("Name the key after the system that will use it.");
  const scopes = (Array.isArray(req.body?.scopes) ? req.body.scopes : API_SCOPES).filter((scope) => API_SCOPES.includes(scope));
  if (!scopes.length) throw badRequest("Choose at least one scope.");
  const plaintext = generateApiKey();
  const key = await ApiKey.create({ name: name.slice(0, 120), prefix: plaintext.slice(0, 12), hash: hashApiKey(plaintext), scopes, createdBy: toActor(req.cmsUser) });
  await audit(req, { action: "apiKey.created", entityType: "apiKey", entityId: key._id, entityLabel: key.name, details: { scopes } });
  // The plaintext is returned exactly once.
  res.status(201).json({ key: { id: String(key._id), name: key.name, prefix: key.prefix, scopes, createdAt: key.createdAt }, secret: plaintext });
};

export const revokeApiKey = async (req, res) => {
  const key = await ApiKey.findById(req.params.id);
  if (!key) throw notFound("API key");
  key.revokedAt = new Date();
  await key.save();
  await audit(req, { action: "apiKey.revoked", entityType: "apiKey", entityId: key._id, entityLabel: key.name });
  res.json({ ok: true });
};

// Webhooks

const validateWebhookUrl = (url) => {
  try {
    const parsed = new URL(String(url));
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") throw new HttpError(400, "Webhook URLs must use https in production.");
    return parsed.toString();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw badRequest("Enter a valid webhook URL.");
  }
};

export const listWebhooks = async (req, res) => {
  const endpoints = await WebhookEndpoint.find({}).sort({ createdAt: -1 }).lean();
  const stats = await WebhookDelivery.aggregate([{ $group: { _id: { endpoint: "$endpointId", status: "$status" }, count: { $sum: 1 } } }]);
  const statMap = {};
  stats.forEach(({ _id, count }) => {
    const key = String(_id.endpoint);
    statMap[key] = { ...(statMap[key] || {}), [_id.status]: count };
  });
  res.json({ items: endpoints.map((endpoint) => ({ ...endpoint, id: String(endpoint._id), deliveries: statMap[String(endpoint._id)] || {} })), events: WEBHOOK_EVENTS });
};

export const createWebhook = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) throw badRequest("Name the webhook.");
  const secret = String(req.body?.secret || "");
  if (secret.length < 24) throw badRequest("The signing secret must be at least 24 characters.");
  const events = (Array.isArray(req.body?.events) ? req.body.events : WEBHOOK_EVENTS).filter((event) => WEBHOOK_EVENTS.includes(event));
  const endpoint = await WebhookEndpoint.create({ name: name.slice(0, 120), url: validateWebhookUrl(req.body?.url), secret, events, active: req.body?.active !== false, createdBy: toActor(req.cmsUser) });
  await audit(req, { action: "webhook.created", entityType: "webhook", entityId: endpoint._id, entityLabel: endpoint.name, details: { url: endpoint.url, events } });
  res.status(201).json({ webhook: { ...endpoint.toObject(), secret: undefined, id: String(endpoint._id) } });
};

export const updateWebhook = async (req, res) => {
  const endpoint = await WebhookEndpoint.findById(req.params.id);
  if (!endpoint) throw notFound("Webhook");
  if (req.body?.name !== undefined) endpoint.name = String(req.body.name).trim().slice(0, 120) || endpoint.name;
  if (req.body?.url !== undefined) endpoint.url = validateWebhookUrl(req.body.url);
  if (req.body?.events !== undefined) endpoint.events = (req.body.events || []).filter((event) => WEBHOOK_EVENTS.includes(event));
  if (req.body?.active !== undefined) endpoint.active = Boolean(req.body.active);
  if (req.body?.secret) {
    if (String(req.body.secret).length < 24) throw badRequest("The signing secret must be at least 24 characters.");
    endpoint.secret = String(req.body.secret);
  }
  await endpoint.save();
  await audit(req, { action: "webhook.updated", entityType: "webhook", entityId: endpoint._id, entityLabel: endpoint.name });
  res.json({ webhook: { ...endpoint.toObject(), secret: undefined, id: String(endpoint._id) } });
};

export const deleteWebhook = async (req, res) => {
  const endpoint = await WebhookEndpoint.findByIdAndDelete(req.params.id);
  if (!endpoint) throw notFound("Webhook");
  await audit(req, { action: "webhook.deleted", entityType: "webhook", entityId: endpoint._id, entityLabel: endpoint.name });
  res.json({ ok: true });
};

export const listWebhookDeliveries = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = { endpointId: req.params.id };
  if (["pending", "success", "failed"].includes(req.query.status)) filter.status = req.query.status;
  const [items, total] = await Promise.all([WebhookDelivery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), WebhookDelivery.countDocuments(filter)]);
  res.json(paginated(items, total, { page, limit }));
};

export const redeliverWebhook = async (req, res) => {
  const delivery = await WebhookDelivery.findOne({ _id: req.params.deliveryId, endpointId: req.params.id });
  if (!delivery) throw notFound("Delivery");
  res.json({ delivery: await redeliver(delivery._id) });
};

export const testWebhook = async (req, res) => {
  const endpoint = await WebhookEndpoint.findById(req.params.id).lean();
  if (!endpoint) throw notFound("Webhook");
  // A synthetic event queued for this endpoint only (regular dispatch fans out
  // to every subscribed endpoint).
  const deliveryId = `dlv_test_${Date.now()}`;
  const delivery = await WebhookDelivery.create({
    endpointId: endpoint._id,
    deliveryId,
    event: "content.updated",
    payload: { id: deliveryId, event: "content.updated", test: true, createdAt: new Date().toISOString(), data: { test: true } },
  });
  res.json({ delivery: await redeliver(delivery._id) });
};
