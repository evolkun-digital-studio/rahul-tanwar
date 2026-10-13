import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

export type Limiter = { check(key: string): Promise<{ success: boolean; retryAfter: number }> };

export function createMemoryLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async check(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((time) => time > t - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { success: false, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)) };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times[times.length - 1] <= t - windowMs) hits.delete(k);
      }
      return { success: true, retryAfter: 0 };
    },
  };
}

const CONFIG = {
  contact: { limit: 5, windowSec: 15 * 60 },
  chat: { limit: 12, windowSec: 60 },
  admin: { limit: 30, windowSec: 15 * 60 },
} as const;

type Name = keyof typeof CONFIG;
const limiters = new Map<Name, Limiter>();

export function getLimiter(name: Name): Limiter {
  const existing = limiters.get(name);
  if (existing) return existing;
  const { limit, windowSec } = CONFIG[name];
  const redis = getRedis();
  let limiter: Limiter;
  if (redis) {
    const remote = new Ratelimit({
      redis,
      prefix: `rt-rl:${name}`,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    });
    limiter = {
      async check(key) {
        try {
          const result = await remote.limit(key);
          return {
            success: result.success,
            retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
          };
        } catch (error) {
          console.error("[ratelimit] redis unavailable, allowing request", error);
          return { success: true, retryAfter: 0 };
        }
      },
    };
  } else {
    limiter = createMemoryLimiter({ limit, windowMs: windowSec * 1000 });
  }
  limiters.set(name, limiter);
  return limiter;
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function resetLimitersForTests() {
  limiters.clear();
}
