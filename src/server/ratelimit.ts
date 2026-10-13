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
        return {
          success: false,
          retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - t) / 1000)),
        };
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

/** Use `primary`; if it throws (e.g. Redis outage) degrade to the per-process `fallback` limiter. */
export function createFallbackLimiter(primary: Limiter, fallback: Limiter): Limiter {
  return {
    async check(key) {
      try {
        return await primary.check(key);
      } catch (error) {
        console.error("[ratelimit] redis unavailable, using in-memory limit", error);
        return fallback.check(key);
      }
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
    const primary: Limiter = {
      async check(key) {
        const result = await remote.limit(key);
        return {
          success: result.success,
          retryAfter: result.success
            ? 0
            : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        };
      },
    };
    limiter = createFallbackLimiter(
      primary,
      createMemoryLimiter({ limit, windowMs: windowSec * 1000 }),
    );
  } else {
    limiter = createMemoryLimiter({ limit, windowMs: windowSec * 1000 });
  }
  limiters.set(name, limiter);
  return limiter;
}

/**
 * Resolve the client address used as the rate-limit key.
 *
 * A client can send any X-Forwarded-For it likes and Next keeps it, so the leftmost entry is
 * attacker-controlled. Only entries appended by proxies we operate can be trusted, and those
 * sit at the right-hand end. On Vercel the platform sets x-real-ip itself. Elsewhere,
 * TRUST_PROXY_HOPS says how many trusted proxies sit in front of the app (default 1 = the
 * rightmost entry); 0 ignores X-Forwarded-For entirely.
 */
export function clientIp(req: Request, env: Record<string, string | undefined> = process.env) {
  const realIp = req.headers.get("x-real-ip")?.trim() || "";
  const forwarded = (req.headers.get("x-forwarded-for") || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (env.VERCEL) return realIp || forwarded[forwarded.length - 1] || "unknown";

  const parsed = Number.parseInt(env.TRUST_PROXY_HOPS ?? "", 10);
  const hops = Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
  if (hops === 0) return realIp || "unknown";
  if (forwarded.length) return forwarded[Math.max(0, forwarded.length - hops)];
  return realIp || "unknown";
}

export function resetLimitersForTests() {
  limiters.clear();
}
