import { getRedisClient, isRedisConfigured } from "../../config/redis.js";
import { cmsConfig } from "../config.js";

// Read-through cache for published delivery data. Uses the portal's Redis when
// configured (shared by every instance, so one invalidation clears all of
// them) and an in-process Map otherwise. All keys share one prefix so a
// publish event can drop everything at once — published reads are cheap to
// rebuild and correctness beats cleverness here.

const PREFIX = "cms:delivery:";
const memory = new Map();

const redis = () => (isRedisConfigured() ? getRedisClient() : null);

export const cacheGet = async (key) => {
  const client = redis();
  if (client) {
    try {
      const raw = await client.get(PREFIX + key);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }
  const hit = memory.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt < Date.now()) {
    memory.delete(key);
    return undefined;
  }
  return hit.value;
};

export const cacheSet = async (key, value, ttlSeconds = cmsConfig.cacheTtlSeconds) => {
  const client = redis();
  if (client) {
    try {
      await client.set(PREFIX + key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // cache is best-effort
    }
    return;
  }
  if (memory.size > 2000) memory.clear();
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

export const cached = async (key, loader, ttlSeconds) => {
  const hit = await cacheGet(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  if (value !== undefined && value !== null) await cacheSet(key, value, ttlSeconds);
  return value;
};

export const invalidateDeliveryCache = async () => {
  memory.clear();
  const client = redis();
  if (!client) return;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await client.scan(cursor, "MATCH", `${PREFIX}*`, "COUNT", 200);
      cursor = next;
      if (keys.length) await client.del(...keys);
    } while (cursor !== "0");
  } catch (error) {
    console.error("[cms] cache invalidation failed:", error.message);
  }
};
