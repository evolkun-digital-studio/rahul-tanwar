import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  checkCredentials,
  requireAdmin,
  safeEqual,
  signAdminToken,
  verifyAdminToken,
} from "./auth";

const secret = "a-test-secret-that-is-long-enough";

describe("credentials", () => {
  const creds = { adminEmail: "admin@example.com", adminPassword: "p@ss" };
  it("accepts the right pair", () => {
    expect(checkCredentials({ email: "admin@example.com", password: "p@ss" }, creds)).toBe(true);
  });
  it("rejects a wrong email or password", () => {
    expect(checkCredentials({ email: "x@example.com", password: "p@ss" }, creds)).toBe(false);
    expect(checkCredentials({ email: "admin@example.com", password: "nope" }, creds)).toBe(false);
  });
  it("safeEqual handles different lengths without throwing", () => {
    expect(safeEqual("a", "abcdef")).toBe(false);
  });
});

describe("tokens", () => {
  it("round-trips", async () => {
    expect(await verifyAdminToken(await signAdminToken("a@b.co", secret), secret)).toBe(true);
  });
  it("rejects a token signed with another secret", async () => {
    expect(
      await verifyAdminToken(await signAdminToken("a@b.co", "other-secret-other-secret"), secret),
    ).toBe(false);
  });
  it("rejects an expired token", async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode(secret));
    expect(await verifyAdminToken(expired, secret)).toBe(false);
  });
  it("rejects a validly signed token that has no exp claim", async () => {
    const noExp = await new SignJWT({ email: "a@b.co" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .sign(new TextEncoder().encode(secret));
    expect(await verifyAdminToken(noExp, secret)).toBe(false);
  });
  it("rejects garbage", async () => {
    expect(await verifyAdminToken("not.a.jwt", secret)).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("returns 401 without a bearer token", async () => {
    process.env.JWT_SECRET = secret;
    process.env.ADMIN_EMAIL = "a@b.co";
    process.env.ADMIN_PASSWORD = "x";
    const res = await requireAdmin(new Request("http://x/api/admin/pages/home"));
    expect(res?.status).toBe(401);
  });
  it("passes with a valid token", async () => {
    process.env.JWT_SECRET = secret;
    process.env.ADMIN_EMAIL = "a@b.co";
    process.env.ADMIN_PASSWORD = "x";
    const token = await signAdminToken("a@b.co", secret);
    const res = await requireAdmin(
      new Request("http://x/api/admin/pages/home", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(res).toBeNull();
  });
});
