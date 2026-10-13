import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const tagged = vi.hoisted(
  () => [] as Array<{ keyParts: string[]; options: { revalidate?: number; tags?: string[] } }>,
);
vi.mock("next/cache", () => ({
  // Passthrough: records how the public read is cached without needing Next's cache runtime.
  unstable_cache: <T extends (...args: never[]) => unknown>(
    fn: T,
    keyParts: string[],
    options: { revalidate?: number; tags?: string[] },
  ) => {
    tagged.push({ keyParts, options });
    return fn;
  },
}));
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));

import { getPageContent } from "./content";
import { resetStoreForTests } from "./store";

beforeEach(async () => {
  process.env.DATA_DIR = await mkdtemp(path.join(tmpdir(), "rt-content-"));
  delete process.env.VERCEL;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  resetStoreForTests();
});

describe("public page content", () => {
  it("caches the public pages read for 60s under the cms tag", () => {
    expect(tagged).toContainEqual({
      keyParts: ["cms-pages"],
      options: { revalidate: 60, tags: ["cms"] },
    });
  });
  it("merges stored content over the defaults", async () => {
    await writeFile(
      path.join(process.env.DATA_DIR as string, "pages.json"),
      JSON.stringify({ home: { slug: "home", pageTitle: "Stored title" } }),
    );
    expect((await getPageContent("home")).pageTitle).toBe("Stored title");
  });
  it("falls back to defaults (and does not throw) when storage is corrupt", async () => {
    await writeFile(path.join(process.env.DATA_DIR as string, "pages.json"), "{ nope");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const content = await getPageContent("home");
    expect(content.slug).toBe("home");
    expect(content.pageTitle).not.toBe("Stored title");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
