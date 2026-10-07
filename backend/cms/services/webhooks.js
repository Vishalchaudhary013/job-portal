import crypto from "crypto";
import { cmsConfig } from "../config.js";
import { WEBHOOK_EVENTS, WebhookDelivery, WebhookEndpoint } from "../models/Webhook.js";

// Outbound webhooks. Every delivery is persisted first and then attempted, so
// nothing is lost if the receiver is down or this process restarts. Failed
// deliveries are retried with backoff by a small worker loop; a delivery is
// "claimed" atomically before sending so several server instances never send
// the same delivery concurrently.
//
// Signature: header `X-Edeco-Signature: t=<unix>,v1=<hex>` where
//   v1 = HMAC_SHA256(secret, `${t}.${rawBody}`)
// Receivers must verify it with a constant-time compare and reject stale
// timestamps (see routes/webhookReceiverRoutes.js for the reference receiver).

const BACKOFF_MINUTES = [1, 5, 30, 120, 720];
const MAX_ATTEMPTS = BACKOFF_MINUTES.length + 1;
const CLAIM_MS = 60_000;

export const signPayload = (secret, rawBody, timestamp = Math.floor(Date.now() / 1000)) => {
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
};

export const verifySignature = (secret, rawBody, header, toleranceSeconds = 300) => {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    String(header)
      .split(",")
      .map((part) => part.trim().split("="))
      .filter((pair) => pair.length === 2),
  );
  const timestamp = Number(parts.t);
  if (!timestamp || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(String(parts.v1), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const attemptDelivery = async (delivery) => {
  const endpoint = await WebhookEndpoint.findById(delivery.endpointId).select("+secret").lean();
  if (!endpoint || !endpoint.active) {
    await WebhookDelivery.updateOne({ _id: delivery._id }, { $set: { status: "failed", lastError: "Endpoint removed or disabled." } });
    return;
  }

  const rawBody = JSON.stringify(delivery.payload);
  const attempts = delivery.attempts + 1;
  let responseStatus = null;
  let error = "";

  try {
    const response = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Edeco-Form-Builder-Webhooks/1.0",
        "X-Edeco-Event": delivery.event,
        "X-Edeco-Delivery": delivery.deliveryId,
        "X-Edeco-Signature": signPayload(endpoint.secret, rawBody),
      },
      body: rawBody,
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    responseStatus = response.status;
    if (!response.ok) error = `Receiver responded with HTTP ${response.status}.`;
  } catch (fetchError) {
    error = fetchError.name === "TimeoutError" ? "Timed out after 10s." : fetchError.message;
  }

  if (!error) {
    await WebhookDelivery.updateOne(
      { _id: delivery._id },
      { $set: { status: "success", attempts, responseStatus, lastError: "", deliveredAt: new Date() } },
    );
    return;
  }

  const giveUp = attempts >= MAX_ATTEMPTS;
  await WebhookDelivery.updateOne(
    { _id: delivery._id },
    {
      $set: {
        status: giveUp ? "failed" : "pending",
        attempts,
        responseStatus,
        lastError: error.slice(0, 500),
        nextAttemptAt: giveUp ? null : new Date(Date.now() + BACKOFF_MINUTES[attempts - 1] * 60_000),
      },
    },
  );
};

const claimAndSend = async (deliveryId) => {
  const claimed = await WebhookDelivery.findOneAndUpdate(
    { _id: deliveryId, status: "pending", nextAttemptAt: { $lte: new Date() } },
    { $set: { nextAttemptAt: new Date(Date.now() + CLAIM_MS) } },
    { new: true },
  ).lean();
  if (claimed) await attemptDelivery(claimed);
};

// Queues `event` for every active endpoint subscribed to it.
export const dispatchWebhook = async (event, data) => {
  if (!WEBHOOK_EVENTS.includes(event)) return;
  try {
    const endpoints = await WebhookEndpoint.find({ active: true, events: event }).select("_id").lean();
    for (const endpoint of endpoints) {
      const deliveryId = `dlv_${crypto.randomUUID()}`;
      const delivery = await WebhookDelivery.create({
        endpointId: endpoint._id,
        deliveryId,
        event,
        payload: { id: deliveryId, event, createdAt: new Date().toISOString(), data },
      });
      claimAndSend(delivery._id).catch((error) => console.error("[cms] webhook send failed:", error.message));
    }
  } catch (error) {
    console.error("[cms] webhook dispatch failed:", error.message);
  }
};

export const redeliver = async (deliveryDocId) => {
  await WebhookDelivery.updateOne({ _id: deliveryDocId }, { $set: { status: "pending", nextAttemptAt: new Date() } });
  await claimAndSend(deliveryDocId);
  return WebhookDelivery.findById(deliveryDocId).lean();
};

let worker = null;
export const startWebhookWorker = () => {
  if (worker) return;
  worker = setInterval(async () => {
    try {
      const due = await WebhookDelivery.find({ status: "pending", nextAttemptAt: { $lte: new Date() } })
        .sort({ nextAttemptAt: 1 })
        .limit(20)
        .select("_id")
        .lean();
      for (const { _id } of due) await claimAndSend(_id);
    } catch (error) {
      console.error("[cms] webhook worker error:", error.message);
    }
  }, 30_000);
  worker.unref();
};

// Registers the env-configured endpoint once (useful for local dev / first deploy).
export const ensureBootstrapWebhook = async () => {
  const { bootstrapWebhookUrl: url, bootstrapWebhookSecret: secret } = cmsConfig;
  if (!url || !secret) return;
  const exists = await WebhookEndpoint.exists({ url });
  if (!exists) {
    await WebhookEndpoint.create({ name: "Bootstrap endpoint", url, secret, events: WEBHOOK_EVENTS });
    console.log(`[cms] Registered bootstrap webhook endpoint ${url}`);
  }
};
