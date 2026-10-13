import { describe, expect, it } from "vitest";
import { clientIp, createMemoryLimiter } from "./ratelimit";

describe("memory limiter", () => {
  it("allows up to the limit then blocks with a retryAfter", async () => {
    let t = 1_000;
    const limiter = createMemoryLimiter({ limit: 2, windowMs: 60_000, now: () => t });
    expect((await limiter.check("ip")).success).toBe(true);
    expect((await limiter.check("ip")).success).toBe(true);
    const blocked = await limiter.check("ip");
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    t += 60_001;
    expect((await limiter.check("ip")).success).toBe(true);
  });
  it("tracks keys independently", async () => {
    const limiter = createMemoryLimiter({ limit: 1, windowMs: 1000 });
    expect((await limiter.check("a")).success).toBe(true);
    expect((await limiter.check("b")).success).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } }))).toBe("9.9.9.9");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
