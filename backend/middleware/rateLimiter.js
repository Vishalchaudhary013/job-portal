import { getRedisClient, isRedisConfigured } from "../config/redis.js";

// Fixed-window counter stored in Redis so the limit is shared across every
// backend instance (an in-memory counter would let a client get `max` requests
// per instance instead of `max` total). Fails open — if Redis is unreachable,
// requests are allowed through rather than locking everyone out of auth.
export const createRateLimiter = ({ windowSeconds, max, keyPrefix, keyGenerator }) => {
  return async (req, res, next) => {
    if (!isRedisConfigured()) {
      next();
      return;
    }

    const client = getRedisClient();
    const identity = keyGenerator ? keyGenerator(req) : req.ip;
    const key = `ratelimit:${keyPrefix}:${identity}`;

    try {
      const count = await client.incr(key);
      if (count === 1) {
        await client.pexpire(key, windowSeconds * 1000);
      }

      if (count > max) {
        const ttlMs = await client.pttl(key);
        const retryAfterSeconds = Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : windowSeconds * 1000) / 1000));
        res.set("Retry-After", String(retryAfterSeconds));
        res.status(429).json({
          message: "Too many requests. Please try again shortly.",
          retryAfterSeconds,
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`[RateLimiter] Redis error on "${keyPrefix}", failing open:`, error.message);
      next();
    }
  };
};
