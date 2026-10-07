import Redis from "ioredis";

// Single shared Redis connection per Node process, used for state that must be
// visible across every backend instance (rate limits, cron leader election,
// caches) — never for data that belongs permanently in MongoDB.
let client = null;

export const isRedisConfigured = () => Boolean(process.env.REDIS_URL);

export const getRedisClient = () => {
  if (!isRedisConfigured()) return null;

  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });

    client.on("connect", () => console.log("Redis connected"));
    client.on("error", (error) => console.error("Redis connection error:", error.message));
  }

  return client;
};

export default getRedisClient;
