import express from "express";
import { cmsAuthenticate, requireCmsSuperAdmin, requirePermission } from "../middleware/access.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { cmsAdminLimiter, cmsExportLimiter, cmsUploadLimiter } from "../middleware/limiters.js";
import { libraryUpload } from "../middleware/upload.js";
import * as types from "../controllers/admin/contentTypesController.js";
import * as contents from "../controllers/admin/contentsController.js";
import * as forms from "../controllers/admin/formsController.js";
import * as templates from "../controllers/admin/templatesController.js";
import * as submissions from "../controllers/admin/submissionsController.js";
import * as media from "../controllers/admin/mediaController.js";
import * as system from "../controllers/admin/systemController.js";

// /api/cms/admin — the Form Builder's own API. Every route requires an Edeco
// admin/super-admin session (existing `protect`) plus a Form Builder permission.
const router = express.Router();
const allow = requirePermission;

router.use(cmsAuthenticate, cmsAdminLimiter);

router.get("/me", system.getMe);
router.get("/dashboard", system.getDashboard);
router.get("/analytics", allow("analytics.read"), system.getAnalytics);

// Content types (form + card + page + presentation configuration)
router.get("/content-types", allow("schema.read", "content.read"), types.listContentTypes);
router.post("/content-types", allow("schema.write"), types.createContentType);
router.get("/content-types/:id", allow("schema.read", "content.read"), types.getContentType);
router.patch("/content-types/:id", allow("schema.write"), types.updateContentTypeMeta);
router.put("/content-types/:id/draft", allow("schema.write"), types.saveContentTypeDraft);
router.get("/content-types/:id/publish-impact", allow("schema.read"), types.getPublishImpact);
router.post("/content-types/:id/publish", allow("schema.publish"), types.publishContentType);
router.get("/content-types/:id/versions", allow("schema.read"), types.listConfigVersions);
router.get("/content-types/:id/versions/:kind/:version", allow("schema.read"), types.getConfigVersion);
router.post("/content-types/:id/versions/:kind/:version/restore", allow("schema.write"), types.restoreVersion);
router.post("/content-types/:id/duplicate", allow("schema.write"), types.duplicateContentType);
router.post("/content-types/:id/archive", allow("schema.delete"), types.setContentTypeArchived);
router.delete("/content-types/:id", allow("schema.delete"), types.deleteContentType);
router.post("/content-types/:id/preview", allow("schema.read", "content.read"), types.createPreviewLink);
router.get("/content-types/:contentTypeId/new-entry", allow("content.write"), contents.getNewContentContext);

// Content entries
router.get("/contents", allow("content.read"), contents.listContents);
router.post("/contents", allow("content.write"), contents.createContent);
router.get("/contents/:id", allow("content.read"), contents.getContent);
router.put("/contents/:id", allow("content.write"), contents.updateContent);
router.post("/contents/:id/actions/:action", allow("content.write", "content.publish"), contents.contentAction);
router.get("/contents/:id/versions", allow("content.read"), contents.listContentVersions);
router.get("/contents/:id/versions/:version", allow("content.read"), contents.getContentVersion);
router.post("/contents/:id/versions/:version/restore", allow("content.write"), contents.restoreContentVersion);
router.post("/contents/:id/duplicate", allow("content.write"), contents.duplicateContent);
router.delete("/contents/:id", allow("content.delete"), contents.deleteContent);

// Response forms
router.get("/forms", allow("schema.read", "submissions.read"), forms.listForms);
router.post("/forms", allow("schema.write"), forms.createForm);
router.get("/forms/:id", allow("schema.read", "submissions.read"), forms.getForm);
router.patch("/forms/:id", allow("schema.write"), forms.updateFormMeta);
router.put("/forms/:id/draft", allow("schema.write"), forms.saveFormDraftHandler);
router.get("/forms/:id/publish-impact", allow("schema.read"), forms.getFormPublishImpact);
router.post("/forms/:id/publish", allow("schema.publish"), forms.publishFormHandler);
router.post("/forms/:id/unpublish", allow("schema.publish"), forms.unpublishForm);
router.get("/forms/:id/versions", allow("schema.read"), forms.listFormVersions);
router.post("/forms/:id/versions/:version/restore", allow("schema.write"), forms.restoreFormVersionHandler);
router.post("/forms/:id/archive", allow("schema.delete"), forms.setFormArchived);
router.delete("/forms/:id", allow("schema.delete"), forms.deleteForm);

// Templates (admin-created only)
router.get("/templates", allow("schema.read"), templates.listTemplates);
router.post("/templates", allow("schema.write"), templates.createTemplate);
router.get("/templates/:id", allow("schema.read"), templates.getTemplate);
router.patch("/templates/:id", allow("schema.write"), templates.updateTemplate);
router.delete("/templates/:id", allow("schema.write"), templates.deleteTemplate);

// Submissions
router.get("/submissions", allow("submissions.read"), submissions.listSubmissions);
router.get("/submissions/export", allow("submissions.export"), cmsExportLimiter, submissions.exportSubmissions);
router.post("/submissions/bulk-status", allow("submissions.manage"), submissions.bulkUpdateSubmissionStatus);
router.get("/submissions/:id", allow("submissions.read"), submissions.getSubmission);
router.patch("/submissions/:id/status", allow("submissions.manage"), submissions.updateSubmissionStatus);
router.post("/submissions/:id/notes", allow("submissions.manage"), submissions.addSubmissionNote);
router.delete("/submissions/:id", allow("submissions.manage"), submissions.deleteSubmission);

// Media
router.get("/media", allow("media.manage", "content.write"), media.listMedia);
router.post("/media", allow("media.manage", "content.write"), cmsUploadLimiter, libraryUpload.array("files", 10), media.uploadMedia);
router.patch("/media/:id", allow("media.manage", "content.write"), media.updateMedia);
router.delete("/media/:id", allow("media.manage"), media.deleteMedia);
router.get("/media/:id/file", allow("media.manage", "submissions.read"), media.downloadMedia);

// Administration — super admin only
router.get("/permissions", requireCmsSuperAdmin, system.getPermissionCatalog);
router.get("/admins", requireCmsSuperAdmin, system.listAdmins);
router.put("/admins/:userId/access", requireCmsSuperAdmin, system.updateAdminAccess);
router.get("/audit-logs", allow("audit.read"), system.listAuditLogs);
router.get("/settings", requireCmsSuperAdmin, system.getSettings);
router.put("/settings", requireCmsSuperAdmin, system.updateSettings);
router.get("/api-keys", requireCmsSuperAdmin, system.listApiKeys);
router.post("/api-keys", requireCmsSuperAdmin, system.createApiKey);
router.post("/api-keys/:id/revoke", requireCmsSuperAdmin, system.revokeApiKey);
router.get("/webhooks", requireCmsSuperAdmin, system.listWebhooks);
router.post("/webhooks", requireCmsSuperAdmin, system.createWebhook);
router.patch("/webhooks/:id", requireCmsSuperAdmin, system.updateWebhook);
router.delete("/webhooks/:id", requireCmsSuperAdmin, system.deleteWebhook);
router.post("/webhooks/:id/test", requireCmsSuperAdmin, system.testWebhook);
router.get("/webhooks/:id/deliveries", requireCmsSuperAdmin, system.listWebhookDeliveries);
router.post("/webhooks/:id/deliveries/:deliveryId/redeliver", requireCmsSuperAdmin, system.redeliverWebhook);

router.use(errorHandler);

export default router;
