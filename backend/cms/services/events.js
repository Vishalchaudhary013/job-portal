import { invalidateDeliveryCache } from "./cache.js";
import { dispatchWebhook } from "./webhooks.js";

// Single place every Form Builder change is announced. Each event:
//   1. invalidates the published-delivery cache used by the portal's pages
//      (so a publish shows up immediately, no stale content), and
//   2. is delivered as a signed webhook to every subscribed endpoint (e.g. the
//      main Edeco site keeping its own cache/search index in sync).

const CACHE_EVENTS = new Set([
  "content.published",
  "content.unpublished",
  "content.archived",
  // content.updated is a DRAFT change — nothing published moved, so the
  // delivery cache stays valid.
  "schema.updated",
  "card.updated",
  "page.updated",
  "presentation.updated",
]);

// In-process subscribers (e.g. the Edeco opportunity sync) — the same events
// external systems receive by webhook, without an HTTP round trip.
const listeners = new Set();
export const onCmsEvent = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emit = async (event, data) => {
  if (CACHE_EVENTS.has(event)) await invalidateDeliveryCache();
  // Webhook delivery is persisted & retried on its own; don't block the request on it.
  dispatchWebhook(event, data).catch(() => {});
  listeners.forEach((listener) => {
    Promise.resolve()
      .then(() => listener(event, data))
      .catch((error) => console.error(`[cms] listener failed for ${event}:`, error.message));
  });
};

// Maps a published configuration kind to its webhook event name.
export const CONFIG_EVENT = {
  form: "schema.updated",
  card: "card.updated",
  page: "page.updated",
  presentation: "presentation.updated",
};
