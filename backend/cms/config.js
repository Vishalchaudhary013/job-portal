import dotenv from "dotenv";

dotenv.config();

// Form Builder (CMS) module configuration. The module runs inside this same
// Express server and MongoDB connection; everything here has a safe dev
// default so the portal boots without extra env vars.
const isProduction = process.env.NODE_ENV === "production";

const previewSecret =
  process.env.CMS_PREVIEW_SECRET || (isProduction ? "" : `dev-preview-${process.env.JWT_SECRET || "secret"}`);

if (isProduction && previewSecret.length < 32) {
  console.warn("[cms] CMS_PREVIEW_SECRET is missing or shorter than 32 characters — preview links are disabled.");
}

export const cmsConfig = {
  isProduction,
  // Public site origin used to build preview URLs (the builder lives on the
  // same frontend, so a relative URL works when this is empty).
  siteUrl: (process.env.CMS_SITE_URL || "").replace(/\/$/, ""),
  // Absolute base for media URLs handed to external API consumers.
  publicBaseUrl: (process.env.CMS_PUBLIC_BASE_URL || "").replace(/\/$/, ""),
  previewSecret,
  previewEnabled: previewSecret.length >= (isProduction ? 32 : 1),
  previewTtlMinutes: Number(process.env.CMS_PREVIEW_TTL_MINUTES) || 30,
  // Optional server-to-server key for /api/cms/v1 (external consumers such as
  // the main Edeco site). Keys can also be created in the Form Builder UI.
  bootstrapApiKey: process.env.CMS_BOOTSTRAP_API_KEY || "",
  // Optional webhook endpoint registered on first boot (e.g. main Edeco site).
  bootstrapWebhookUrl: process.env.CMS_BOOTSTRAP_WEBHOOK_URL || "",
  bootstrapWebhookSecret: process.env.CMS_BOOTSTRAP_WEBHOOK_SECRET || "",
  // Secret this server uses to verify webhooks it RECEIVES at
  // /api/webhooks/form-builder.
  inboundWebhookSecret: process.env.CMS_WEBHOOK_SECRET || "",
  uploadDir: process.env.CMS_UPLOAD_DIR || "uploads/cms",
  privateUploadDir: process.env.CMS_PRIVATE_UPLOAD_DIR || "uploads-private/cms",
  maxUploadMb: Number(process.env.CMS_MAX_UPLOAD_MB) || 20,
  cacheTtlSeconds: Number(process.env.CMS_CACHE_TTL_SECONDS) || 300,
};
