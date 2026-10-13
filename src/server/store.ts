import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import mediaSeed from "../../content/media.json";
import pagesSeed from "../../content/pages.json";
import settingsSeed from "../../content/settings.json";
import { getRedis } from "./redis";

export type DocKey = "pages" | "settings" | "media";
export type Seed = Record<DocKey, unknown>;
type Pages = Record<string, Record<string, unknown>>;
type Settings = Record<string, unknown>;
type Media = Array<Record<string, unknown>>;

export class StorageUnavailableError extends Error {
  constructor() {
    super(
      "Content storage is not configured. Set the Upstash Redis variables (Vercel) or run on a host with a writable data directory.",
    );
    this.name = "StorageUnavailableError";
  }
}

export interface StorageBackend {
  get(key: DocKey): Promise<unknown | null>;
  set(key: DocKey, value: unknown): Promise<void>;
}

export type RedisLike = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<unknown>;
};

export function createFileBackend(dir: string): StorageBackend {
  const file = (key: DocKey) => path.join(dir, `${key}.json`);
  return {
    async get(key) {
      try {
        return JSON.parse(await readFile(file(key), "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        if (error instanceof SyntaxError) {
          console.error(`[store] ${key}.json is not valid JSON; using seed content`);
          return null;
        }
        throw error;
      }
    },
    async set(key, value) {
      await mkdir(dir, { recursive: true });
      const tmp = `${file(key)}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`);
      await rename(tmp, file(key));
    },
  };
}

export function createRedisBackend(client: RedisLike, prefix = "rt-cms:"): StorageBackend {
  return {
    async get(key) {
      return (await client.get(prefix + key)) ?? null;
    },
    async set(key, value) {
      await client.set(prefix + key, value);
    },
  };
}

type ReadOpts = { strict?: boolean };

export type Store = {
  readPages(opts?: ReadOpts): Promise<Pages>;
  writePages(value: Pages): Promise<void>;
  readSettings(opts?: ReadOpts): Promise<Settings>;
  writeSettings(value: Settings): Promise<void>;
  readMedia(opts?: ReadOpts): Promise<Media>;
  writeMedia(value: Media): Promise<void>;
};

export function createStore(backend: StorageBackend | null, seed: Seed): Store {
  async function read<T>(key: DocKey, opts?: ReadOpts): Promise<T> {
    if (backend) {
      try {
        const stored = await backend.get(key);
        if (stored !== null && stored !== undefined) return stored as T;
      } catch (error) {
        if (opts?.strict) throw error;
        console.error(`[store] failed to read ${key}; using seed content`, error);
      }
    }
    return structuredClone(seed[key]) as T;
  }
  async function write(key: DocKey, value: unknown) {
    if (!backend) throw new StorageUnavailableError();
    await backend.set(key, value);
  }
  return {
    readPages: (opts) => read<Pages>("pages", opts),
    writePages: (value) => write("pages", value),
    readSettings: (opts) => read<Settings>("settings", opts),
    writeSettings: (value) => write("settings", value),
    readMedia: (opts) => read<Media>("media", opts),
    writeMedia: (value) => write("media", value),
  };
}

let cached: Store | undefined;

export function getStore(env: NodeJS.ProcessEnv = process.env): Store {
  if (cached) return cached;
  const redis = getRedis(env);
  const backend: StorageBackend | null = redis
    ? createRedisBackend(redis)
    : env.VERCEL
      ? null
      : createFileBackend(env.DATA_DIR || path.join(process.cwd(), "data"));
  cached = createStore(backend, {
    pages: pagesSeed,
    settings: settingsSeed,
    media: mediaSeed,
  });
  return cached;
}

export function resetStoreForTests() {
  cached = undefined;
}
