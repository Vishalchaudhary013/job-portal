import { createRateLimiter } from "../../middleware/rateLimiter.js";

// Form Builder rate limits, built on the portal's shared Redis limiter.
const byCmsUser = (req) => req.cmsUser?.id || req.ip;
const byApiClient = (req) => req.apiClient?.id || req.ip;

export const cmsAdminLimiter = createRateLimiter({ windowSeconds: 60, max: 600, keyPrefix: "cms-admin", keyGenerator: byCmsUser });
export const cmsUploadLimiter = createRateLimiter({ windowSeconds: 60, max: 60, keyPrefix: "cms-upload", keyGenerator: byCmsUser });
export const cmsExportLimiter = createRateLimiter({ windowSeconds: 60, max: 10, keyPrefix: "cms-export", keyGenerator: byCmsUser });
export const cmsApiLimiter = createRateLimiter({ windowSeconds: 60, max: 3000, keyPrefix: "cms-v1", keyGenerator: byApiClient });
// Public read endpoints used by the portal's own pages.
export const cmsPublicLimiter = createRateLimiter({ windowSeconds: 60, max: 300, keyPrefix: "cms-public", keyGenerator: (req) => req.ip });
// Response-form submissions and attachment uploads from site visitors.
export const cmsSubmitLimiter = createRateLimiter({
  windowSeconds: 60,
  max: 15,
  keyPrefix: "cms-submit",
  keyGenerator: (req) => String(req.user?._id || req.ip),
});
export const cmsWebhookLimiter = createRateLimiter({ windowSeconds: 60, max: 600, keyPrefix: "cms-webhook-in", keyGenerator: (req) => req.ip });
