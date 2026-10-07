import express from "express";
import { cmsConfig } from "../config.js";
import { cmsWebhookLimiter } from "../middleware/limiters.js";
import { invalidateDeliveryCache } from "../services/cache.js";
import { verifySignature } from "../services/webhooks.js";

// Reference RECEIVER for Form Builder webhooks — POST /api/webhooks/form-builder.
//
// Inside this server, publishes already invalidate the delivery cache
// in-process; this endpoint exists for deployments where another Form Builder
// instance (or a second portal instance with its own memory cache) needs to be
// told about changes, and documents exactly how a consumer such as the main
// Edeco site must verify deliveries:
//   1. read the RAW body (signature is over the exact bytes),
//   2. check `X-Edeco-Signature` (HMAC-SHA256, constant-time, 5-min tolerance),
//   3. de-duplicate on `X-Edeco-Delivery` (retries reuse the same id),
//   4. respond 2xx quickly, then act.
//
// Must be mounted BEFORE express.json() so the raw body is available.

const seen = new Map();
const SEEN_TTL_MS = 24 * 60 * 60 * 1000;

const router = express.Router();

router.post("/", cmsWebhookLimiter, express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
  if (!cmsConfig.inboundWebhookSecret) {
    res.status(503).json({ message: "Webhook receiver is not configured (CMS_WEBHOOK_SECRET)." });
    return;
  }
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  if (!verifySignature(cmsConfig.inboundWebhookSecret, raw, req.get("x-edeco-signature"))) {
    res.status(401).json({ message: "Invalid signature." });
    return;
  }

  const deliveryId = req.get("x-edeco-delivery") || "";
  const now = Date.now();
  for (const [id, at] of seen) if (now - at > SEEN_TTL_MS) seen.delete(id);
  if (deliveryId && seen.has(deliveryId)) {
    res.json({ ok: true, duplicate: true });
    return;
  }
  if (deliveryId) seen.set(deliveryId, now);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    res.status(400).json({ message: "Malformed payload." });
    return;
  }

  res.json({ ok: true });

  // Anything that changes what is published invalidates cached delivery reads.
  if (/^(content|schema|card|page|presentation)\./.test(String(payload?.event || ""))) {
    invalidateDeliveryCache().catch(() => {});
  }
});

export default router;
