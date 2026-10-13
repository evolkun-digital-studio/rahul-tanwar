import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  StorageUnavailableError,
  createFileBackend,
  createRedisBackend,
  createStore,
  type StorageBackend,
} from "./store";

const seed = {
  pages: { home: { slug: "home", pageTitle: "Seed home" } },
  settings: { companyEmail: "seed@example.com" },
  media: [],
};

async function tempDir() {
  return mkdtemp(path.join(tmpdir(), "rt-store-"));
}

describe("file backend", () => {
  it("round-trips a document", async () => {
    const backend = createFileBackend(await tempDir());
    await backend.set("pages", { a: 1 });
    expect(await backend.get("pages")).toEqual({ a: 1 });
  });

  it("returns null for a missing file", async () => {
    expect(await createFileBackend(await tempDir()).get("media")).toBeNull();
  });

  it("returns null (not a crash) for corrupt JSON", async () => {
    const dir = await tempDir();
    await writeFile(path.join(dir, "pages.json"), "{ not json");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await createFileBackend(dir).get("pages")).toBeNull();
    spy.mockRestore();
  });

  it("writes valid JSON atomically (no leftover temp file)", async () => {
    const dir = await tempDir();
    await createFileBackend(dir).set("settings", { x: 1 });
    expect(JSON.parse(await readFile(path.join(dir, "settings.json"), "utf8"))).toEqual({ x: 1 });
    const { readdir } = await import("node:fs/promises");
    expect((await readdir(dir)).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });
});

describe("redis backend", () => {
  it("namespaces keys and maps undefined to null", async () => {
    const data = new Map<string, unknown>();
    const client = {
      get: async (k: string) => data.get(k),
      set: async (k: string, v: unknown) => void data.set(k, v),
    };
    const backend = createRedisBackend(client, "t:");
    expect(await backend.get("pages")).toBeNull();
    await backend.set("pages", { a: 1 });
    expect(data.get("t:pages")).toEqual({ a: 1 });
    expect(await backend.get("pages")).toEqual({ a: 1 });
  });
});

describe("store", () => {
  it("falls back to a clone of the seed when storage is empty", async () => {
    const store = createStore(createFileBackend(await tempDir()), seed);
    const pages = await store.readPages();
    expect(pages.home.pageTitle).toBe("Seed home");
    pages.home.pageTitle = "mutated";
    expect((await store.readPages()).home.pageTitle).toBe("Seed home");
  });

  it("reads stored data over the seed", async () => {
    const store = createStore(createFileBackend(await tempDir()), seed);
    await store.writePages({ home: { slug: "home", pageTitle: "Saved" } });
    expect((await store.readPages()).home.pageTitle).toBe("Saved");
  });

  it("non-strict reads swallow backend errors and use the seed", async () => {
    const broken: StorageBackend = {
      get: async () => {
        throw new Error("redis down");
      },
      set: async () => {},
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createStore(broken, seed);
    expect((await store.readPages()).home.pageTitle).toBe("Seed home");
    spy.mockRestore();
  });

  it("strict reads propagate backend errors so admin never overwrites real data with seed", async () => {
    const broken: StorageBackend = {
      get: async () => {
        throw new Error("redis down");
      },
      set: async () => {},
    };
    await expect(createStore(broken, seed).readPages({ strict: true })).rejects.toThrow("redis down");
  });

  it("serves the seed but refuses writes when no backend is configured", async () => {
    const store = createStore(null, seed);
    expect((await store.readSettings()).companyEmail).toBe("seed@example.com");
    await expect(store.writeSettings({})).rejects.toBeInstanceOf(StorageUnavailableError);
  });
});
