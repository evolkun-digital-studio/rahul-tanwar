import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

import { revalidatePath, revalidateTag } from "next/cache";
import { signAdminToken } from "./auth";
import { resetLimitersForTests } from "./ratelimit";
import { resetStoreForTests } from "./store";
import { GET as publicPage } from "../../app/api/public/pages/[slug]/route";
import { POST as login } from "../../app/api/admin/login/route";
import { GET as dashboard } from "../../app/api/admin/dashboard/route";
import { GET as adminGetPage, PUT as adminPutPage } from "../../app/api/admin/pages/[slug]/route";
import { GET as mediaGet, POST as mediaPost } from "../../app/api/admin/media/route";
import { GET as settingsGet, PUT as settingsPut } from "../../app/api/admin/settings/route";

const SECRET = "a-test-secret-that-is-long-enough";
const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) });

async function authed(path: string, method = "GET", body?: unknown) {
  const token = await signAdminToken("admin@example.com", SECRET);
  return new Request(`http://x${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

beforeEach(async () => {
  process.env.JWT_SECRET = SECRET;
  process.env.ADMIN_EMAIL = "admin@example.com";
  process.env.ADMIN_PASSWORD = "correct horse";
  process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), "rt-api-"));
  delete process.env.VERCEL;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  resetStoreForTests();
  resetLimitersForTests();
  vi.mocked(revalidatePath).mockClear();
  vi.mocked(revalidateTag).mockClear();
});

describe("public pages", () => {
  it("returns seeded page content", async () => {
    const res = await publicPage(new Request("http://x"), ctx("home"));
    expect(res.status).toBe(200);
    expect((await res.json()).page.slug).toBe("home");
  });
  it("returns { page: null } for unknown or dangerous slugs", async () => {
    for (const slug of ["nope", "__proto__", "constructor", "Home", "../x"]) {
      const res = await publicPage(new Request("http://x"), ctx(slug));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ page: null });
    }
  });
});

describe("admin login", () => {
  const req = (body: BodyInit) =>
    new Request("http://x/api/admin/login", {
      method: "POST",
      body,
      headers: { "x-forwarded-for": "7.7.7.7" },
    });
  it("returns a token for correct credentials", async () => {
    const res = await login(
      req(JSON.stringify({ email: "admin@example.com", password: "correct horse" })),
    );
    expect(res.status).toBe(200);
    expect(typeof (await res.json()).token).toBe("string");
  });
  it("returns 401 for wrong credentials", async () => {
    const res = await login(req(JSON.stringify({ email: "admin@example.com", password: "wrong" })));
    expect(res.status).toBe(401);
  });
  it("returns 400 for malformed, empty and non-object bodies", async () => {
    for (const body of ["{oops", "", "[]", "null", '"str"']) {
      expect((await login(req(body))).status).toBe(400);
    }
  });
  it("returns 500 JSON (not a crash) when auth env is missing", async () => {
    delete process.env.JWT_SECRET;
    const res = await login(req(JSON.stringify({ email: "a@b.co", password: "x" })));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });
  it("rate limits after 30 attempts", async () => {
    let last = 0;
    for (let i = 0; i < 31; i++) {
      last = (await login(req(JSON.stringify({ email: "a@b.co", password: "x" })))).status;
    }
    expect(last).toBe(429);
  });
});

describe("admin auth guard", () => {
  it("rejects unauthenticated requests on every admin route", async () => {
    const anon = (p: string, m = "GET") => new Request(`http://x${p}`, { method: m });
    expect((await dashboard(anon("/api/admin/dashboard"))).status).toBe(401);
    expect((await adminGetPage(anon("/api/admin/pages/home"), ctx("home"))).status).toBe(401);
    expect((await adminPutPage(anon("/api/admin/pages/home", "PUT"), ctx("home"))).status).toBe(
      401,
    );
    expect((await mediaGet(anon("/api/admin/media"))).status).toBe(401);
    expect((await mediaPost(anon("/api/admin/media", "POST"))).status).toBe(401);
    expect((await settingsGet(anon("/api/admin/settings"))).status).toBe(401);
    expect((await settingsPut(anon("/api/admin/settings", "PUT"))).status).toBe(401);
  });
});

describe("admin pages", () => {
  it("returns 503 and leaves a corrupt data file untouched on PUT; public GET still serves the seed", async () => {
    const file = path.join(process.env.DATA_DIR as string, "pages.json");
    await writeFile(file, "{ corrupt but recoverable");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await adminPutPage(
      await authed("/api/admin/pages/home", "PUT", { pageTitle: "Edited" }),
      ctx("home"),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain('"pages"');
    expect(await readFile(file, "utf8")).toBe("{ corrupt but recoverable");
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();

    const pub = await publicPage(new Request("http://x"), ctx("home"));
    expect(pub.status).toBe(200);
    expect((await pub.json()).page.slug).toBe("home");
    spy.mockRestore();
  });
  it("PUT merges, forces the slug, stamps updatedAt and revalidates", async () => {
    const res = await adminPutPage(
      await authed("/api/admin/pages/home", "PUT", { pageTitle: "Edited", slug: "hijack" }),
      ctx("home"),
    );
    expect(res.status).toBe(200);
    const { page } = await res.json();
    expect(page.pageTitle).toBe("Edited");
    expect(page.slug).toBe("home");
    expect(page.updatedAt).toBeTruthy();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidateTag).toHaveBeenCalledWith("cms", { expire: 0 });
    const read = await publicPage(new Request("http://x"), ctx("home"));
    expect((await read.json()).page.pageTitle).toBe("Edited");
  });
  it("PUT rejects unknown or dangerous slugs with 400", async () => {
    for (const slug of ["nope", "__proto__", "constructor"]) {
      const res = await adminPutPage(
        await authed(`/api/admin/pages/${slug}`, "PUT", { a: 1 }),
        ctx(slug),
      );
      expect(res.status).toBe(400);
    }
  });
  it("PUT rejects non-object bodies with 400", async () => {
    for (const body of [[], null, "x", 5]) {
      const res = await adminPutPage(
        await authed("/api/admin/pages/home", "PUT", body),
        ctx("home"),
      );
      expect(res.status).toBe(400);
    }
  });
  it("PUT returns 413 for an oversized body", async () => {
    const res = await adminPutPage(
      await authed("/api/admin/pages/home", "PUT", { blob: "x".repeat(1_100_000) }),
      ctx("home"),
    );
    expect(res.status).toBe(413);
  });
  it("PUT returns 503 on Vercel without Redis, and GET still works", async () => {
    process.env.VERCEL = "1";
    resetStoreForTests();
    const put = await adminPutPage(
      await authed("/api/admin/pages/home", "PUT", { pageTitle: "x" }),
      ctx("home"),
    );
    expect(put.status).toBe(503);
    expect((await put.json()).error).toMatch(/storage/i);
    const get = await publicPage(new Request("http://x"), ctx("home"));
    expect(get.status).toBe(200);
  });
});

describe("admin dashboard, media, settings", () => {
  it("dashboard reports counts", async () => {
    const res = await dashboard(await authed("/api/admin/dashboard"));
    const { stats } = await res.json();
    expect(stats).toMatchObject({ leads: 0, media: 0 });
    expect(stats.pages).toBeGreaterThan(0);
  });
  it("media POST validates the url and stores newest first", async () => {
    const bad = await mediaPost(await authed("/api/admin/media", "POST", { url: "not a url" }));
    expect(bad.status).toBe(400);
    const ok = await mediaPost(
      await authed("/api/admin/media", "POST", { url: "https://x.test/a.jpg", altText: "A" }),
    );
    expect(ok.status).toBe(201);
    const { asset } = await ok.json();
    expect(asset.id).toBeTruthy();
    const list = await (await mediaGet(await authed("/api/admin/media"))).json();
    expect(list.assets[0].url).toBe("https://x.test/a.jpg");
  });
  it("settings PUT replaces the document and stamps updatedAt", async () => {
    const res = await settingsPut(
      await authed("/api/admin/settings", "PUT", { companyEmail: "new@example.com" }),
    );
    const { settings } = await res.json();
    expect(settings.companyEmail).toBe("new@example.com");
    expect(settings.updatedAt).toBeTruthy();
    expect(revalidateTag).toHaveBeenCalledWith("cms", { expire: 0 });
    const read = await (await settingsGet(await authed("/api/admin/settings"))).json();
    expect(read.settings.companyEmail).toBe("new@example.com");
  });
});
