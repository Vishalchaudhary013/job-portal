import mongoose from "mongoose";
import { actorSchema } from "./common.js";

export const WEBHOOK_EVENTS = [
  "content.created",
  "content.updated",
  "content.published",
  "content.unpublished",
  "content.archived",
  "schema.updated",
  "card.updated",
  "page.updated",
  "presentation.updated",
  "submission.created",
  "submission.updated",
];

const webhookEndpointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true },
    secret: { type: String, required: true, select: false },
    events: { type: [String], default: WEBHOOK_EVENTS },
    active: { type: Boolean, default: true },
    createdBy: { type: actorSchema, default: null },
  },
  { timestamps: true },
);

export const WebhookEndpoint = mongoose.model("CmsWebhookEndpoint", webhookEndpointSchema, "cms_webhook_endpoints");

const webhookDeliverySchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: "CmsWebhookEndpoint", required: true, index: true },
    deliveryId: { type: String, required: true, unique: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    responseStatus: { type: Number, default: null },
    lastError: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false },
);

// Delivery logs are operational data, not history — expire after 30 days.
webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const WebhookDelivery = mongoose.model("CmsWebhookDelivery", webhookDeliverySchema, "cms_webhook_deliveries");
