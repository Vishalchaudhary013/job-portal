import adminRoutes from "./routes/adminRoutes.js";
import { publicRouter, v1Router } from "./routes/deliveryRoutes.js";
import webhookReceiverRoutes from "./routes/webhookReceiverRoutes.js";
import { ensureBootstrapWebhook, startWebhookWorker } from "./services/webhooks.js";

// Form Builder (CMS) module. Runs inside the portal's Express server and
// MongoDB connection but keeps its own boundary:
//   - its own collections (cms_*), models and services;
//   - the rest of the portal reads it only through the delivery layer
//     (/api/cms/public, /api/cms/v1) — never through its models;
//   - admin access reuses the existing Edeco auth (`protect`) unchanged.

// Raw-body webhook receiver — must be registered before express.json().
export const mountCmsWebhookReceiver = (app) => {
  app.use("/api/webhooks/form-builder", webhookReceiverRoutes);
};

export const mountCms = (app) => {
  app.use("/api/cms/admin", adminRoutes);
  app.use("/api/cms/public", publicRouter);
  app.use("/api/cms/v1", v1Router);
};

export const startCms = () => {
  startWebhookWorker();
  ensureBootstrapWebhook().catch((error) => console.error("[cms] bootstrap webhook failed:", error.message));
};
