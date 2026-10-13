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
  const req = (headers: Record<string, string> = {}) => new Request("http://x", { headers });

  it("uses the rightmost x-forwarded-for entry by default (trusted proxy appended it)", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }), {})).toBe("5.6.7.8");
  });
  it("ignores a spoofed leftmost value", () => {
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), {})).toBe("203.0.113.9");
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6" }), {})).toBe("6.6.6.6");
  });
  it("honours TRUST_PROXY_HOPS as the Nth entry from the right", () => {
    const headers = { "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.1" };
    expect(clientIp(req(headers), { TRUST_PROXY_HOPS: "2" })).toBe("203.0.113.9");
    expect(clientIp(req(headers), { TRUST_PROXY_HOPS: "3" })).toBe("6.6.6.6");
  });
  it("falls back to the leftmost entry when there are fewer entries than hops", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1" }), { TRUST_PROXY_HOPS: "2" })).toBe(
      "1.1.1.1",
    );
  });
  it("TRUST_PROXY_HOPS=0 ignores x-forwarded-for and uses x-real-ip then 'unknown'", () => {
    const env = { TRUST_PROXY_HOPS: "0" };
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "9.9.9.9" }), env)).toBe(
      "9.9.9.9",
    );
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6" }), env)).toBe("unknown");
  });
  it("treats an invalid TRUST_PROXY_HOPS as the default of 1", () => {
    expect(
      clientIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }), { TRUST_PROXY_HOPS: "abc" }),
    ).toBe("2.2.2.2");
  });
  it("on Vercel prefers x-real-ip, then the rightmost x-forwarded-for entry", () => {
    const env = { VERCEL: "1" };
    expect(
      clientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7", "x-real-ip": "9.9.9.9" }), env),
    ).toBe("9.9.9.9");
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 7.7.7.7" }), env)).toBe("7.7.7.7");
  });
  it("falls back to x-real-ip when x-forwarded-for is absent, then 'unknown'", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }), {})).toBe("9.9.9.9");
    expect(clientIp(req(), {})).toBe("unknown");
  });
});
