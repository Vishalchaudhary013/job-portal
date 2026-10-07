import express from "express";
import { attachUserIfPresent, protect, requireAdmin } from "../../middleware/authMiddleware.js";
import { authenticateApiKey, requireScope } from "../middleware/apiKey.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { cmsApiLimiter, cmsPublicLimiter, cmsSubmitLimiter } from "../middleware/limiters.js";
import { submissionUpload } from "../middleware/upload.js";
import { deliveryHandlers, getMediaInfo, submitFromApi, submitFromPortal, uploadSubmissionFile } from "../controllers/deliveryController.js";

// /api/cms/public — the portal's own pages 
// Published data only. No secrets are involved, so the browser can call it
// directly; drafts are reachable only through a signed preview token.
export const publicRouter = express.Router();
const site = deliveryHandlers({ absolute: false });

publicRouter.use(cmsPublicLimiter);
publicRouter.get("/types", site.listTypes);
publicRouter.get("/types/:slug", site.getType);
publicRouter.get("/types/:slug/entries", site.listEntries);
publicRouter.get("/types/:slug/entries/:entrySlug", site.getEntry);
publicRouter.get("/entries/:id", site.getEntryById);
publicRouter.get("/entries/:id/related", site.getRelated);
publicRouter.get("/forms/:slug", site.getForm);
publicRouter.post("/forms/:slug/submissions", attachUserIfPresent, cmsSubmitLimiter, submitFromPortal);
publicRouter.post("/forms/:slug/uploads", attachUserIfPresent, cmsSubmitLimiter, submissionUpload.single("file"), uploadSubmissionFile);
publicRouter.get("/preview", site.getPreview);
// Lightweight numbers for the Edeco Admin Dashboard card.
publicRouter.get("/dashboard-stats", protect, requireAdmin, site.getStats);
publicRouter.use(errorHandler);

// /api/cms/v1 — versioned server-to-server API
export const v1Router = express.Router();
const api = deliveryHandlers({ absolute: true });

v1Router.use(authenticateApiKey, cmsApiLimiter);
v1Router.get("/content-types", requireScope("content:read"), api.listTypes);
v1Router.get("/content-types/:slug", requireScope("content:read"), api.getType);
v1Router.get("/content-types/:slug/content", requireScope("content:read"), api.listEntries);
v1Router.get("/content-types/:slug/content/:entrySlug", requireScope("content:read"), api.getEntry);
v1Router.get("/content/:id", requireScope("content:read"), api.getEntryById);
v1Router.get("/content/:id/related", requireScope("content:read"), api.getRelated);
v1Router.get("/media/:id", requireScope("content:read"), getMediaInfo);
v1Router.get("/forms/:slug", requireScope("content:read"), api.getForm);
v1Router.post("/forms/:slug/submissions", requireScope("submissions:write"), submitFromApi);
v1Router.post("/forms/:slug/uploads", requireScope("submissions:write"), submissionUpload.single("file"), uploadSubmissionFile);
v1Router.get("/preview/:token", requireScope("preview:read"), api.getPreview);
v1Router.get("/stats", requireScope("stats:read"), api.getStats);
v1Router.use(errorHandler);
