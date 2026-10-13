# Next.js App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Vite SPA + Express server with one Next.js App Router app (TSX + Tailwind v4) that deploys to both Vercel and cPanel (Node.js app).

**Architecture:** `app/` routes are thin server components that load CMS content through a storage-adapter store (Upstash Redis on Vercel, JSON files on cPanel, bundled seed as fallback) and hand it to existing client "view" components. API routes are Next Route Handlers that keep the Express request/response contracts. SEO moves to `generateMetadata` + server-rendered JSON-LD.

**Tech Stack:** Next.js (App Router), React 19, Tailwind CSS v4 (`@tailwindcss/postcss`), TypeScript, `jose`, `@upstash/redis`, `@upstash/ratelimit`, zod, nodemailer, openai, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-13-nextjs-app-router-migration-design.md`

## Global Constraints

- Work on branch `next-migration`. Windows + Git Bash; Node 24 locally, target `engines.node` `>=20.9`.
- Path alias `@/*` → `./src/*` stays. New server code lives in `src/server/`; routes in root `app/`.
- No visual or copy changes. Do not edit `src/home-*.css` or section components except where a task says so.
- Root `package.json` must NOT contain `"type": "module"` (Next standalone `server.js` is CommonJS). Config files are `.mjs`/`.ts`.
- API contracts preserved: `POST /api/admin/login` → `{ token }`; `GET /api/public/pages/:slug` → `{ page }`; `GET|PUT /api/admin/pages/:slug` → `{ page }`; `GET /api/admin/dashboard` → `{ stats: { leads, media, pages } }`; `GET|POST /api/admin/media` → `{ assets }` / `201 { asset }`; `GET|PUT /api/admin/settings` → `{ settings }`; `POST /api/contact` → `201 { success: true }` (honeypot → `200 { success: true }`); `POST /api/chat` → `{ reply }`. Errors are JSON `{ error: string }`.
- Rate limits: contact 5 / 15 min, chat 12 / 1 min, admin login 30 / 15 min, keyed by client IP.
- Env var names: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SITE_URL`, `CONTACT_TO_EMAIL`, `SMTP_HOST|PORT|SECURE|USER|PASS|FROM`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` (also accept `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), `DATA_DIR`.
- Secrets are read lazily at request time, never at import/build time.
- Commits: `git commit -m "<message>" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`.
- `tsc` and `next build` are expected to be RED until Task 7 completes. Tasks 1–6 are verified with Vitest (and a dev-server smoke in Task 1). Do not run `next build` before Task 7.

## Review Focus

1. Malformed, empty, array or oversized JSON body on any POST/PUT → `400`/`413` JSON error, never a `500` or crash. (Task 4, 5)
2. Slugs `__proto__`, `constructor`, uppercase or unknown → public GET returns `{ page: null }`; admin PUT returns `400`; no prototype pollution. (Task 4)
3. Missing or corrupt `data/pages.json` → pages still render from seed; reads never throw; admin writes after a storage read *error* do not overwrite real data with seed. (Task 2)
4. Vercel without Redis: public pages render from seed; admin saves return a clear `503`. (Task 2, 4)
5. CMS text containing `</script>`, `<`, quotes or ` ` cannot break out of JSON-LD or metadata. (Task 6)

---

### Task 1: Scaffold Next.js, Tailwind, Vitest

**Files:**
- Modify: `package.json`, `tsconfig.json`, `.gitignore`, `src/styles.css:1-3`, `eslint.config.js` → rename `eslint.config.mjs`, `docs/superpowers/specs/2026-10-13-nextjs-app-router-migration-design.md`
- Create: `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `app/layout.tsx` (temporary), `app/page.tsx` (temporary)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `typecheck`, `lint`, `test`; Tailwind compiling through PostCSS; `npm test` runnable.

- [ ] **Step 1: Record the lint baseline (before changing anything)**

Run: `npx eslint . --format json -o "$TEMP/lint-baseline.json"; node -e "const r=require(process.env.TEMP+'/lint-baseline.json');console.log('errors',r.reduce((a,f)=>a+f.errorCount,0),'warnings',r.reduce((a,f)=>a+f.warningCount,0))"`
Expected: prints counts. Write them in your task notes; Task 10 compares against them.

- [ ] **Step 2: Install dependencies**

```bash
npm install next@latest react@latest react-dom@latest jose @upstash/redis @upstash/ratelimit
npm install -D vitest @tailwindcss/postcss postcss
```
Expected: installs succeed. Note the resolved `next` version (`npm ls next`); this plan's code uses `params: Promise<...>` which works on Next 15+.

- [ ] **Step 3: Rewrite `package.json` scripts, engines and drop `"type": "module"`**

Edit `package.json`: delete the line `"type": "module",`; set `"scripts"` to:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "format": "prettier --write .",
  "map:build": "node scripts/build-corridor-map.mjs",
  "package:cpanel": "node scripts/package-cpanel.mjs"
},
"engines": { "node": ">=20.9" },
```
(The old `server`, `build:dev`, `preview` scripts are removed.)

- [ ] **Step 4: Create `next.config.ts`**

```ts
import path from "node:path";
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=15552000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd()),
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
```

- [ ] **Step 5: Create `postcss.config.mjs`**

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 6: Point Tailwind at both source folders**

Edit `src/styles.css` lines 1–3 to:

```css
@import "tailwindcss" source(none);
@source "../src";
@source "../app";
@import "tw-animate-css";
```

- [ ] **Step 7: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "noFallthroughCasesInSwitch": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": [
    "node_modules",
    ".next",
    "dist-cpanel",
    "server",
    "src/routes",
    "src/main.tsx",
    "src/router.tsx",
    "src/routeTree.gen.ts"
  ]
}
```
(`src/routes`, `main.tsx`, `router.tsx`, `routeTree.gen.ts` are excluded only until Task 7/10 remove them.)

- [ ] **Step 8: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 9: Rename the ESLint config and update ignores**

```bash
git mv eslint.config.js eslint.config.mjs
```
In `eslint.config.mjs` change the first line of the config to `{ ignores: [".next", "dist-cpanel", "server", "node_modules", "next-env.d.ts"] },`. Leave the rest unchanged.

- [ ] **Step 10: Update `.gitignore`**

Append:

```
.next
dist-cpanel
next-env.d.ts
/data
*.tsbuildinfo
```

- [ ] **Step 11: Temporary app shell**

`app/layout.tsx`:

```tsx
import "../src/styles.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:

```tsx
export default function Page() {
  return <p className="p-8 text-2xl font-bold text-primary">scaffold ok</p>;
}
```

- [ ] **Step 12: Amend the spec for three decisions made while planning**

In the spec: (a) replace the "Fonts" bullet with "Fonts: keep the Google Fonts `<link>` tags (DM Sans + Noto Sans Devanagari) from `index.html` in the root layout head; CSS references the literal family names, which `next/font` would rename." (b) In Storage, replace "call `revalidateTag("cms")`" with "call `revalidatePath("/", "layout")`; pages use `export const revalidate = 60` as a safety net". (c) Under Architecture add "Route page components stay client components (`src/views/*`) receiving `content` as a prop; `app/**/page.tsx` are server components that fetch content and render metadata/JSON-LD." Also add `/admin/[[...slug]]` to the route list.

- [ ] **Step 13: Verify Vitest runs and the dev server compiles Tailwind**

Run: `npx vitest run --passWithNoTests`
Expected: exits 0.

Run (background): `npx next dev -p 3100`, then:
`curl -s http://localhost:3100/ | grep -o "scaffold ok"` and `curl -s http://localhost:3100/ | grep -c 'rel="stylesheet"'`
Expected: `scaffold ok` printed; stylesheet count ≥ 1. Stop the dev server. (`next dev` also generates `next-env.d.ts`, which is gitignored.)

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app router, PostCSS Tailwind, Vitest" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Seed content and storage adapter

**Files:**
- Move: `server/data/pages.json`, `server/data/settings.json`, `server/data/media.json` → `content/`
- Create: `src/server/store.ts`, `src/server/redis.ts`, `src/server/store.test.ts`

**Interfaces:**
- Produces (`src/server/store.ts`):
  ```ts
  export type DocKey = "pages" | "settings" | "media";
  export type Seed = Record<DocKey, unknown>;
  export interface StorageBackend { get(key: DocKey): Promise<unknown | null>; set(key: DocKey, value: unknown): Promise<void>; }
  export class StorageUnavailableError extends Error {}
  export function createFileBackend(dir: string): StorageBackend;
  export function createRedisBackend(client: RedisLike, prefix?: string): StorageBackend;
  export type RedisLike = { get(key: string): Promise<unknown>; set(key: string, value: unknown): Promise<unknown> };
  export type Store = {
    readPages(opts?: { strict?: boolean }): Promise<Record<string, Record<string, unknown>>>;
    writePages(v: Record<string, Record<string, unknown>>): Promise<void>;
    readSettings(opts?: { strict?: boolean }): Promise<Record<string, unknown>>;
    writeSettings(v: Record<string, unknown>): Promise<void>;
    readMedia(opts?: { strict?: boolean }): Promise<Array<Record<string, unknown>>>;
    writeMedia(v: Array<Record<string, unknown>>): Promise<void>;
  };
  export function createStore(backend: StorageBackend | null, seed: Seed): Store;
  export function getStore(): Store;           // memoised; picks backend from env
  export function resetStoreForTests(): void;
  ```
- Produces (`src/server/redis.ts`): `export function getRedis(source?: NodeJS.ProcessEnv): Redis | null`.

- [ ] **Step 1: Move the seed files**

```bash
mkdir -p content && git mv server/data/pages.json content/pages.json && git mv server/data/settings.json content/settings.json && git mv server/data/media.json content/media.json
```

- [ ] **Step 2: Write the failing tests** — `src/server/store.test.ts`

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/server/store.test.ts`
Expected: FAIL — cannot resolve `./store`.

- [ ] **Step 4: Implement `src/server/redis.ts`**

```ts
import { Redis } from "@upstash/redis";

let cached: Redis | null | undefined;

export function getRedis(source: NodeJS.ProcessEnv = process.env): Redis | null {
  if (source === process.env && cached !== undefined) return cached;
  const url = source.KV_REST_API_URL || source.UPSTASH_REDIS_REST_URL;
  const token = source.KV_REST_API_TOKEN || source.UPSTASH_REDIS_REST_TOKEN;
  const client = url && token ? new Redis({ url, token }) : null;
  if (source === process.env) cached = client;
  return client;
}

export function resetRedisForTests() {
  cached = undefined;
}
```

- [ ] **Step 5: Implement `src/server/store.ts`**

```ts
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/server/store.test.ts`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add CMS storage adapter (file, Upstash Redis, seed fallback)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Env config, auth, rate limiting, HTTP helpers

**Files:**
- Create: `src/server/env.ts`, `src/server/auth.ts`, `src/server/ratelimit.ts`, `src/server/http.ts`, `src/server/auth.test.ts`, `src/server/ratelimit.test.ts`, `src/server/http.test.ts`

**Interfaces:**
- Produces (`env.ts`):
  ```ts
  export class ConfigError extends Error {}
  export function getAuthConfig(source?: NodeJS.ProcessEnv): { jwtSecret: string; adminEmail: string; adminPassword: string };
  export function getSiteUrl(source?: NodeJS.ProcessEnv): string; // no trailing slash
  export function getMailConfig(source?: NodeJS.ProcessEnv): { host: string; port: number; secure: boolean; user: string; pass: string; from: string; to: string };
  export function getOpenAiConfig(source?: NodeJS.ProcessEnv): { apiKey: string; model: string };
  ```
- Produces (`auth.ts`):
  ```ts
  export function safeEqual(a: string, b: string): boolean;
  export function checkCredentials(input: { email: string; password: string }, creds: { adminEmail: string; adminPassword: string }): boolean;
  export function signAdminToken(email: string, secret: string): Promise<string>;
  export function verifyAdminToken(token: string, secret: string): Promise<boolean>;
  export function requireAdmin(req: Request): Promise<Response | null>; // null = authorised
  ```
- Produces (`ratelimit.ts`):
  ```ts
  export type Limiter = { check(key: string): Promise<{ success: boolean; retryAfter: number }> };
  export function createMemoryLimiter(opts: { limit: number; windowMs: number; now?: () => number }): Limiter;
  export function getLimiter(name: "contact" | "chat" | "admin"): Limiter;
  export function clientIp(req: Request): string;
  export function resetLimitersForTests(): void;
  ```
- Produces (`http.ts`):
  ```ts
  export function json(data: unknown, init?: number | ResponseInit): Response; // sets Cache-Control: no-store
  export function rateLimited(retryAfter: number): Response;
  export function readJsonBody(req: Request, maxBytes?: number): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }>;
  export function isPlainObject(v: unknown): v is Record<string, unknown>;
  export function handleError(error: unknown): Response; // StorageUnavailableError→503, ConfigError→500, else 500
  export const SLUG_RE: RegExp; // /^[a-z0-9][a-z0-9-]{0,63}$/
  ```

- [ ] **Step 1: Write the failing tests**

`src/server/auth.test.ts`:

```ts
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { checkCredentials, requireAdmin, safeEqual, signAdminToken, verifyAdminToken } from "./auth";

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
    expect(await verifyAdminToken(await signAdminToken("a@b.co", "other-secret-other-secret"), secret)).toBe(false);
  });
  it("rejects an expired token", async () => {
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode(secret));
    expect(await verifyAdminToken(expired, secret)).toBe(false);
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
      new Request("http://x/api/admin/pages/home", { headers: { authorization: `Bearer ${token}` } }),
    );
    expect(res).toBeNull();
  });
});
```

`src/server/ratelimit.test.ts`:

```ts
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
```

`src/server/http.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ConfigError } from "./env";
import { SLUG_RE, handleError, isPlainObject, readJsonBody } from "./http";
import { StorageUnavailableError } from "./store";

const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body, headers });

describe("readJsonBody", () => {
  it("parses valid JSON", async () => {
    const r = await readJsonBody(post(JSON.stringify({ a: 1 })));
    expect(r).toEqual({ ok: true, data: { a: 1 } });
  });
  it("returns 400 for malformed JSON", async () => {
    const r = await readJsonBody(post("{oops"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
  it("returns 400 for an empty body", async () => {
    const r = await readJsonBody(post(""));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
  it("returns 413 when content-length exceeds the cap", async () => {
    const r = await readJsonBody(post("{}", { "content-length": "5000000" }), 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });
  it("returns 413 when the actual body exceeds the cap", async () => {
    const r = await readJsonBody(post(JSON.stringify({ a: "x".repeat(2000) })), 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });
});

describe("helpers", () => {
  it("isPlainObject rejects null, arrays and primitives", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject("x")).toBe(false);
  });
  it("SLUG_RE accepts page slugs and rejects dangerous ones", () => {
    expect(SLUG_RE.test("volt-50000")).toBe(true);
    for (const bad of ["__proto__", "constructor", "Home", "../x", "", "a b"]) {
      expect(SLUG_RE.test(bad) && !["constructor"].includes(bad)).toBe(false);
    }
  });
  it("handleError maps known errors", async () => {
    expect((await handleError(new StorageUnavailableError())).status).toBe(503);
    expect((await handleError(new ConfigError("missing"))).status).toBe(500);
    expect((await handleError(new Error("boom"))).status).toBe(500);
  });
});
```

(`constructor` matches `SLUG_RE`; Task 4 guards it with `Object.hasOwn` and a known-slug list, which is why the test only asserts the slug regex rejects the others.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/server/auth.test.ts src/server/ratelimit.test.ts src/server/http.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/server/env.ts`**

```ts
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getAuthConfig(source: NodeJS.ProcessEnv = process.env) {
  const missing = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"].filter((key) => !source[key]);
  if (missing.length) {
    throw new ConfigError(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (source.NODE_ENV === "production" && (source.JWT_SECRET as string).length < 16) {
    throw new ConfigError("JWT_SECRET must be at least 16 characters in production");
  }
  return {
    jwtSecret: source.JWT_SECRET as string,
    adminEmail: source.ADMIN_EMAIL as string,
    adminPassword: source.ADMIN_PASSWORD as string,
  };
}

export function getSiteUrl(source: NodeJS.ProcessEnv = process.env) {
  return (source.SITE_URL || "https://rahultanwar.com").replace(/\/+$/, "");
}

export function getMailConfig(source: NodeJS.ProcessEnv = process.env) {
  return {
    host: source.SMTP_HOST || "",
    port: Number(source.SMTP_PORT || 587),
    secure: source.SMTP_SECURE === "true",
    user: source.SMTP_USER || "",
    pass: source.SMTP_PASS || "",
    from: source.SMTP_FROM || source.SMTP_USER || "",
    to: source.CONTACT_TO_EMAIL || "",
  };
}

export function getOpenAiConfig(source: NodeJS.ProcessEnv = process.env) {
  return { apiKey: source.OPENAI_API_KEY || "", model: source.OPENAI_MODEL || "gpt-4.1-mini" };
}
```

- [ ] **Step 4: Implement `src/server/auth.ts`**

```ts
import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getAuthConfig } from "./env";
import { handleError, json } from "./http";

const encode = (value: string) => new TextEncoder().encode(value);

export function safeEqual(a: string, b: string) {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function checkCredentials(
  input: { email: string; password: string },
  creds: { adminEmail: string; adminPassword: string },
) {
  const emailOk = safeEqual(input.email, creds.adminEmail);
  const passwordOk = safeEqual(input.password, creds.adminPassword);
  return emailOk && passwordOk;
}

export function signAdminToken(email: string, secret: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("env-admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encode(secret));
}

export async function verifyAdminToken(token: string, secret: string) {
  try {
    await jwtVerify(token, encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request): Promise<Response | null> {
  try {
    const { jwtSecret } = getAuthConfig();
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return json({ error: "Authentication required" }, 401);
    if (!(await verifyAdminToken(token, jwtSecret))) {
      return json({ error: "Invalid or expired session" }, 401);
    }
    return null;
  } catch (error) {
    return handleError(error);
  }
}
```

- [ ] **Step 5: Implement `src/server/http.ts`**

```ts
import { ConfigError } from "./env";
import { StorageUnavailableError } from "./store";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function json(data: unknown, init: number | ResponseInit = 200) {
  const options = typeof init === "number" ? { status: init } : init;
  const headers = new Headers(options.headers);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...options, headers });
}

export function rateLimited(retryAfter: number) {
  return json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(
  req: Request,
  maxBytes = 1_000_000,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) return { ok: false, response: json({ error: "Request too large" }, 413) };
  let text = "";
  try {
    text = await req.text();
  } catch {
    return { ok: false, response: json({ error: "Invalid request body" }, 400) };
  }
  if (text.length > maxBytes) return { ok: false, response: json({ error: "Request too large" }, 413) };
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, response: json({ error: "Invalid JSON body" }, 400) };
  }
}

export function handleError(error: unknown) {
  if (error instanceof StorageUnavailableError) return json({ error: error.message }, 503);
  if (error instanceof ConfigError) {
    console.error("[config]", error.message);
    return json({ error: "Server is not configured" }, 500);
  }
  console.error("[api]", error);
  return json({ error: "Something went wrong" }, 500);
}
```

(`auth.ts` ↔ `http.ts` import each other's helpers one-way only: `auth` imports `http`; `http` does not import `auth`.)

- [ ] **Step 6: Implement `src/server/ratelimit.ts`**

```ts
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
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/server/auth.test.ts src/server/ratelimit.test.ts src/server/http.test.ts`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add env config, JWT auth, rate limiting and HTTP helpers" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Public and admin API routes

**Files:**
- Create: `src/lib/slugs.ts`, `app/api/public/pages/[slug]/route.ts`, `app/api/public/settings/route.ts`, `app/api/admin/login/route.ts`, `app/api/admin/dashboard/route.ts`, `app/api/admin/pages/[slug]/route.ts`, `app/api/admin/media/route.ts`, `app/api/admin/settings/route.ts`, `src/server/admin-api.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–3.
- Produces (`src/lib/slugs.ts`): `export const PAGE_SLUGS: readonly ["home","privacy","sr18-gaming","delhi-6","volt-50000","masai","adatto","arnika-textiles"]; export const VENTURE_SLUGS: readonly [...6 venture slugs]; export function isPageSlug(v: string): boolean`.
- Route files export `GET`/`POST`/`PUT` handlers with signature `(req: Request, ctx: { params: Promise<{ slug: string }> })` for dynamic routes.

- [ ] **Step 1: Create `src/lib/slugs.ts`**

```ts
export const VENTURE_SLUGS = [
  "sr18-gaming",
  "delhi-6",
  "volt-50000",
  "masai",
  "adatto",
  "arnika-textiles",
] as const;

export const PAGE_SLUGS = ["home", "privacy", ...VENTURE_SLUGS] as const;

export function isPageSlug(value: string): value is (typeof PAGE_SLUGS)[number] {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}
```

- [ ] **Step 2: Write the failing tests** — `src/server/admin-api.test.ts`

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";
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
    new Request("http://x/api/admin/login", { method: "POST", body, headers: { "x-forwarded-for": "7.7.7.7" } });
  it("returns a token for correct credentials", async () => {
    const res = await login(req(JSON.stringify({ email: "admin@example.com", password: "correct horse" })));
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
    expect((await adminPutPage(anon("/api/admin/pages/home", "PUT"), ctx("home"))).status).toBe(401);
    expect((await mediaGet(anon("/api/admin/media"))).status).toBe(401);
    expect((await mediaPost(anon("/api/admin/media", "POST"))).status).toBe(401);
    expect((await settingsGet(anon("/api/admin/settings"))).status).toBe(401);
    expect((await settingsPut(anon("/api/admin/settings", "PUT"))).status).toBe(401);
  });
});

describe("admin pages", () => {
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
    const read = await publicPage(new Request("http://x"), ctx("home"));
    expect((await read.json()).page.pageTitle).toBe("Edited");
  });
  it("PUT rejects unknown or dangerous slugs with 400", async () => {
    for (const slug of ["nope", "__proto__", "constructor"]) {
      const res = await adminPutPage(await authed(`/api/admin/pages/${slug}`, "PUT", { a: 1 }), ctx(slug));
      expect(res.status).toBe(400);
    }
  });
  it("PUT rejects non-object bodies with 400", async () => {
    for (const body of [[], null, "x", 5]) {
      const res = await adminPutPage(await authed("/api/admin/pages/home", "PUT", body), ctx("home"));
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
    const put = await adminPutPage(await authed("/api/admin/pages/home", "PUT", { pageTitle: "x" }), ctx("home"));
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
    const ok = await mediaPost(await authed("/api/admin/media", "POST", { url: "https://x.test/a.jpg", altText: "A" }));
    expect(ok.status).toBe(201);
    const { asset } = await ok.json();
    expect(asset.id).toBeTruthy();
    const list = await (await mediaGet(await authed("/api/admin/media"))).json();
    expect(list.assets[0].url).toBe("https://x.test/a.jpg");
  });
  it("settings PUT replaces the document and stamps updatedAt", async () => {
    const res = await settingsPut(await authed("/api/admin/settings", "PUT", { companyEmail: "new@example.com" }));
    const { settings } = await res.json();
    expect(settings.companyEmail).toBe("new@example.com");
    expect(settings.updatedAt).toBeTruthy();
    const read = await (await settingsGet(await authed("/api/admin/settings"))).json();
    expect(read.settings.companyEmail).toBe("new@example.com");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/server/admin-api.test.ts`
Expected: FAIL — route modules not found.

- [ ] **Step 4: Implement the route files**

`app/api/public/pages/[slug]/route.ts`:

```ts
import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const pages = await getStore().readPages();
    const page = Object.hasOwn(pages, slug) ? pages[slug] : null;
    return json({ page }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/public/settings/route.ts`:

```ts
import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return json({ settings: await getStore().readSettings() });
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/admin/login/route.ts`:

```ts
import { z } from "zod";
import { checkCredentials, signAdminToken } from "@/server/auth";
import { getAuthConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("admin").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 10_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Invalid login details" }, 400);

    const config = getAuthConfig();
    if (!checkCredentials(parsed.data, config)) {
      return json({ error: "Invalid email or password" }, 401);
    }
    return json({ token: await signAdminToken(config.adminEmail, config.jwtSecret) });
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/admin/dashboard/route.ts`:

```ts
import { requireAdmin } from "@/server/auth";
import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const store = getStore();
    const [media, pages] = await Promise.all([store.readMedia(), store.readPages()]);
    return json({ stats: { leads: 0, media: media.length, pages: Object.keys(pages).length } });
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/admin/pages/[slug]/route.ts`:

```ts
import { revalidatePath } from "next/cache";
import { isPageSlug } from "@/lib/slugs";
import { requireAdmin } from "@/server/auth";
import { handleError, isPlainObject, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug } = await ctx.params;
    const pages = await getStore().readPages();
    return json({ page: Object.hasOwn(pages, slug) ? pages[slug] : null });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug } = await ctx.params;
    if (!isPageSlug(slug)) return json({ error: "Unknown page" }, 400);
    const body = await readJsonBody(req);
    if (!body.ok) return body.response;
    if (!isPlainObject(body.data)) return json({ error: "Page content must be an object" }, 400);

    const store = getStore();
    const pages = await store.readPages({ strict: true });
    const existing = Object.hasOwn(pages, slug) ? pages[slug] : {};
    const page = { ...existing, ...body.data, slug, updatedAt: new Date().toISOString() };
    await store.writePages({ ...pages, [slug]: page });
    revalidatePath("/", "layout");
    return json({ page });
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/admin/media/route.ts`:

```ts
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { handleError, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().trim().url(),
  altText: z.string().trim().max(300).optional().default(""),
  title: z.string().trim().max(160).optional().default(""),
  usageLocation: z.string().trim().max(160).optional().default(""),
});

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return json({ assets: await getStore().readMedia() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJsonBody(req, 50_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Valid image URL is required" }, 400);

    const store = getStore();
    const media = await store.readMedia({ strict: true });
    const asset = {
      id: randomUUID(),
      url: parsed.data.url,
      altText: parsed.data.altText,
      title: parsed.data.title || parsed.data.url,
      usageLocation: parsed.data.usageLocation,
      createdAt: new Date().toISOString(),
    };
    await store.writeMedia([asset, ...media]);
    return json({ asset }, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

`app/api/admin/settings/route.ts`:

```ts
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { handleError, isPlainObject, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return json({ settings: await getStore().readSettings() });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJsonBody(req, 100_000);
    if (!body.ok) return body.response;
    if (!isPlainObject(body.data)) return json({ error: "Settings must be an object" }, 400);
    const settings = { ...body.data, updatedAt: new Date().toISOString() };
    await getStore().writeSettings(settings);
    revalidatePath("/", "layout");
    return json({ settings });
  } catch (error) {
    return handleError(error);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/server/admin-api.test.ts`
Expected: all PASS. If the 30-attempt rate-limit test fails because a previous test consumed attempts, confirm `resetLimitersForTests()` runs in `beforeEach` (it does).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port public and admin APIs to Next route handlers" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Contact and chat API routes

**Files:**
- Create: `app/api/contact/route.ts`, `app/api/chat/route.ts`, `src/server/contact-chat.test.ts`

**Interfaces:**
- Consumes: `readJsonBody`, `json`, `rateLimited`, `handleError`, `getLimiter`, `clientIp`, `getMailConfig`, `getOpenAiConfig`.
- Produces: `POST` handlers matching the Global Constraints contracts.

- [ ] **Step 1: Write the failing tests** — `src/server/contact-chat.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn().mockResolvedValue({});
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));

const create = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { POST as chat } from "../../app/api/chat/route";
import { POST as contact } from "../../app/api/contact/route";
import { resetLimitersForTests } from "./ratelimit";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  service: "Partnership",
  message: "I would like to discuss a partnership.",
  website: "",
};
const post = (path: string, body: BodyInit, ip = "1.1.1.1") =>
  new Request(`http://x${path}`, { method: "POST", body, headers: { "x-forwarded-for": ip } });

beforeEach(() => {
  resetLimitersForTests();
  sendMail.mockClear();
  create.mockReset();
  process.env.SMTP_HOST = "smtp.test";
  process.env.SMTP_USER = "u";
  process.env.SMTP_PASS = "p";
  process.env.CONTACT_TO_EMAIL = "to@example.com";
  process.env.OPENAI_API_KEY = "sk-test";
});

describe("POST /api/contact", () => {
  it("sends mail and returns 201", async () => {
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "to@example.com", replyTo: "ada@example.com" });
  });
  it("silently succeeds for honeypot submissions without sending", async () => {
    const res = await contact(post("/api/contact", JSON.stringify({ ...valid, website: "http://spam" })));
    expect(res.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it("returns 400 for invalid fields", async () => {
    const res = await contact(post("/api/contact", JSON.stringify({ ...valid, email: "nope" })));
    expect(res.status).toBe(400);
  });
  it("returns 400 for malformed, empty and non-object bodies", async () => {
    for (const body of ["{oops", "", "[]", "null"]) {
      expect((await contact(post("/api/contact", body))).status).toBe(400);
    }
  });
  it("returns 503 when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(503);
  });
  it("returns 500 JSON when the transport throws", async () => {
    sendMail.mockRejectedValueOnce(new Error("smtp down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
  it("rate limits the 6th request from one IP within the window", async () => {
    let status = 0;
    for (let i = 0; i < 6; i++) status = (await contact(post("/api/contact", JSON.stringify(valid)))).status;
    expect(status).toBe(429);
  });
});

describe("POST /api/chat", () => {
  it("returns the model reply", async () => {
    create.mockResolvedValue({ choices: [{ message: { content: "Hello!" } }] });
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: "Hello!" });
  });
  it("falls back to a contact-form message when the model returns nothing", async () => {
    create.mockResolvedValue({ choices: [] });
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect((await res.json()).reply).toMatch(/contact form/i);
  });
  it("returns 400 for invalid or oversized messages and malformed JSON", async () => {
    expect((await chat(post("/api/chat", JSON.stringify({ message: "x" })))).status).toBe(400);
    expect((await chat(post("/api/chat", JSON.stringify({ message: "x".repeat(1001) })))).status).toBe(400);
    expect((await chat(post("/api/chat", "{oops"))).status).toBe(400);
  });
  it("returns 503 when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect(res.status).toBe(503);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/server/contact-chat.test.ts`
Expected: FAIL — route modules not found.

- [ ] **Step 3: Implement `app/api/contact/route.ts`**

```ts
import nodemailer from "nodemailer";
import { z } from "zod";
import { getMailConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(""),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("contact").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 20_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return json({ error: "Please check the form fields and try again." }, 400);
    }
    if (parsed.data.website) return json({ success: true });

    const mail = getMailConfig();
    if (!mail.host || !mail.to || !mail.user || !mail.pass) {
      return json({ error: "Email delivery is not configured. Please contact us directly." }, 503);
    }

    const transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
    });
    await transporter.sendMail({
      from: mail.from,
      to: mail.to,
      replyTo: parsed.data.email,
      subject: `New website enquiry: ${parsed.data.service}`,
      text: [
        `Name: ${parsed.data.name}`,
        `Email: ${parsed.data.email}`,
        `Phone: ${parsed.data.phone}`,
        `Service: ${parsed.data.service}`,
        "",
        parsed.data.message,
      ].join("\n"),
    });
    return json({ success: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
```

(The body `z.object` rejects `[]`/`null` because they are not objects, so non-object bodies return 400 via the zod branch.)

- [ ] **Step 4: Implement `app/api/chat/route.ts`**

```ts
import OpenAI from "openai";
import { z } from "zod";
import { getOpenAiConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().trim().min(2).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) }))
    .max(8)
    .optional()
    .default([]),
});

const systemPrompt = `You are RT Intelligence, the website assistant for Rahul Tanwar and SR18's venture ecosystem.
Answer concisely and professionally using only public website context.
Relevant ventures include SR18 Gaming, Delhi 6, Volt 50000, Masai, Adatto and Arnika Textiles.
For partnerships, investments, media, hiring, or detailed commercial discussions, ask the visitor to use the contact form.
Do not invent confidential financials, private phone numbers, or non-public claims.`;

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("chat").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 20_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Invalid chat request" }, 400);

    const { apiKey, model } = getOpenAiConfig();
    if (!apiKey) return json({ error: "Chat is not configured yet" }, 503);

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 260,
      messages: [
        { role: "system", content: systemPrompt },
        ...parsed.data.history,
        { role: "user", content: parsed.data.message },
      ],
    });
    return json({
      reply:
        completion.choices[0]?.message?.content ||
        "Please use the contact form and the team will respond.",
    });
  } catch (error) {
    return handleError(error);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run`
Expected: whole suite PASS (Tasks 2–5).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: port contact and chat APIs to Next route handlers" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: CMS library refactor and SEO builders

**Files:**
- Modify: `src/lib/cms.ts` (remove hook + DOM SEO; export helpers)
- Create: `src/server/seo.ts`, `src/server/content.ts`, `src/server/seo.test.ts`, `src/lib/cms.test.ts`

**Interfaces:**
- Consumes: `PageCmsContent`, defaults from `src/lib/cms.ts`; `getSiteUrl`; `getStore`; `PAGE_SLUGS`.
- Produces (`src/lib/cms.ts` new exports): `export function getDefaultContent(slug: string): PageCmsContent | undefined; export function mergeContent(defaults: PageCmsContent, page?: Partial<PageCmsContent>): PageCmsContent;` and `PageCmsContent` gains `updatedAt?: string`.
- Produces (`src/server/seo.ts`): `export function buildMetadata(content: PageCmsContent): import("next").Metadata; export function buildJsonLd(content: PageCmsContent, siteUrl?: string): Record<string, unknown>; export function serializeJsonLd(data: unknown): string;`
- Produces (`src/server/content.ts`): `export const getPageContent: (slug: string) => Promise<PageCmsContent>` (React-`cache`d; falls back to defaults if storage throws; throws only for unknown slug).

- [ ] **Step 1: Write failing tests**

`src/lib/cms.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PAGE_SLUGS } from "./slugs";
import { defaultHomeContent, getDefaultContent, mergeContent } from "./cms";

describe("getDefaultContent", () => {
  it("has defaults for every page slug and none for unknown ones", () => {
    for (const slug of PAGE_SLUGS) expect(getDefaultContent(slug)?.slug).toBe(slug);
    expect(getDefaultContent("nope")).toBeUndefined();
    expect(getDefaultContent("__proto__")).toBeUndefined();
  });
});

describe("mergeContent", () => {
  it("overrides fields and deep-merges header, images, socialLinks, sections", () => {
    const merged = mergeContent(defaultHomeContent, {
      pageTitle: "CMS title",
      header: { brand: "CMS brand" } as never,
      socialLinks: { whatsapp: "wa" },
    });
    expect(merged.pageTitle).toBe("CMS title");
    expect(merged.header.brand).toBe("CMS brand");
    expect(merged.header.links).toEqual(defaultHomeContent.header.links);
    expect(merged.socialLinks.linkedin).toBe(defaultHomeContent.socialLinks.linkedin);
    expect(merged.socialLinks.whatsapp).toBe("wa");
  });
  it("returns the defaults when there is no CMS page", () => {
    expect(mergeContent(defaultHomeContent, undefined)).toEqual(defaultHomeContent);
    expect(mergeContent(defaultHomeContent, null as never)).toEqual(defaultHomeContent);
  });
});
```

`src/server/seo.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultHomeContent, defaultPrivacyContent, mergeContent } from "@/lib/cms";
import { buildJsonLd, buildMetadata, serializeJsonLd } from "./seo";

describe("buildMetadata", () => {
  it("maps title, description, canonical, OG and Twitter", () => {
    const m = buildMetadata(defaultHomeContent);
    expect(m.title).toEqual({ absolute: defaultHomeContent.metaTitle });
    expect(m.description).toBe(defaultHomeContent.metaDescription);
    expect(m.alternates?.canonical).toBe(defaultHomeContent.canonicalUrl);
    expect(m.openGraph).toMatchObject({ title: defaultHomeContent.ogTitle, type: "website" });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.robots).toContain("max-image-preview:large");
  });
  it("falls back to pageTitle when metaTitle is empty", () => {
    const m = buildMetadata({ ...defaultHomeContent, metaTitle: "" });
    expect(m.title).toEqual({ absolute: defaultHomeContent.pageTitle });
  });
});

describe("buildJsonLd", () => {
  it("home is a ProfilePage with a Quotation and no breadcrumb", () => {
    const graph = (buildJsonLd(defaultHomeContent) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("ProfilePage");
    expect(types).toContain("Quotation");
    expect(types).not.toContain("BreadcrumbList");
  });
  it("inner pages get a WebPage and a BreadcrumbList", () => {
    const graph = (buildJsonLd(defaultPrivacyContent) as { "@graph": Array<Record<string, unknown>> })["@graph"];
    const types = graph.map((n) => n["@type"]);
    expect(types).toContain("WebPage");
    expect(types).toContain("BreadcrumbList");
  });
  it("only keeps https social links in sameAs", () => {
    const content = mergeContent(defaultHomeContent, { socialLinks: { linkedin: "javascript:alert(1)" } });
    const person = (buildJsonLd(content) as { "@graph": Array<Record<string, unknown>> })["@graph"].find(
      (n) => n["@type"] === "Person",
    );
    expect(person?.sameAs).toEqual([]);
  });
});

describe("serializeJsonLd", () => {
  it("cannot be broken out of a script tag", () => {
    const hostile = { name: "</script><script>alert(1)</script>", sep: "a b c", q: '"quoted"' };
    const out = serializeJsonLd(hostile);
    expect(out).not.toContain("</script");
    expect(out).not.toContain("<");
    expect(out).not.toContain(" ");
    expect(out).not.toContain(" ");
    expect(JSON.parse(out)).toEqual(hostile);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/cms.test.ts src/server/seo.test.ts`
Expected: FAIL — `getDefaultContent`/`seo` not found.

- [ ] **Step 3: Refactor `src/lib/cms.ts`**

1. Change line 1 `import { useEffect, useState } from "react";` → delete it.
2. In `PageCmsContent` add `updatedAt?: string;` after `canonicalUrl`.
3. Delete everything from `function mergeContent(` through the end of the file (the old `mergeContent`, `setMeta`, `applyPageSeo`, `usePageContent`) and append:

```ts
import { PAGE_SLUGS } from "@/lib/slugs";

const DEFAULTS_BY_SLUG: Record<(typeof PAGE_SLUGS)[number], PageCmsContent> = {
  home: defaultHomeContent,
  privacy: defaultPrivacyContent,
  "sr18-gaming": defaultSr18GamingContent,
  "delhi-6": defaultDelhi6Content,
  masai: defaultMasaiContent,
  adatto: defaultAdattoContent,
  "volt-50000": defaultVolt50000Content,
  "arnika-textiles": defaultArnikaContent,
};

export function getDefaultContent(slug: string): PageCmsContent | undefined {
  return Object.hasOwn(DEFAULTS_BY_SLUG, slug)
    ? DEFAULTS_BY_SLUG[slug as keyof typeof DEFAULTS_BY_SLUG]
    : undefined;
}

export function mergeContent(
  defaults: PageCmsContent,
  page?: Partial<PageCmsContent> | null,
): PageCmsContent {
  return {
    ...defaults,
    ...(page || {}),
    header: { ...defaults.header, ...(page?.header || {}) },
    images: { ...defaults.images, ...(page?.images || {}) },
    socialLinks: { ...defaults.socialLinks, ...(page?.socialLinks || {}) },
    sections: { ...defaults.sections, ...(page?.sections || {}) },
  };
}
```
(Put the `import` for `PAGE_SLUGS` with the other imports at the top of the file, not at the bottom.)

- [ ] **Step 4: Implement `src/server/seo.ts`**

```ts
import type { Metadata } from "next";
import { BUSINESS_PHILOSOPHY_QUOTE, type PageCmsContent } from "@/lib/cms";
import { getSiteUrl } from "./env";

const ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

export function buildMetadata(content: PageCmsContent): Metadata {
  const title = content.metaTitle || content.pageTitle;
  const ogTitle = content.ogTitle || title;
  const ogDescription = content.ogDescription || content.metaDescription;
  const ogImage = content.ogImage || undefined;
  const twitterImage = content.twitterImage || ogImage;
  return {
    title: { absolute: title },
    description: content.metaDescription,
    alternates: { canonical: content.canonicalUrl },
    robots: ROBOTS,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: content.ogUrl || content.canonicalUrl,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: content.twitterTitle || ogTitle,
      description: content.twitterDescription || ogDescription,
      images: twitterImage ? [twitterImage] : undefined,
    },
  };
}

export function buildJsonLd(content: PageCmsContent, siteUrl = getSiteUrl()) {
  const isHome = content.slug === "home";
  const pageUrl = content.canonicalUrl || `${siteUrl}/`;
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Person",
      "@id": personId,
      name: "Rahul Tanwar",
      url: `${siteUrl}/`,
      image: content.images.founder?.url || `${siteUrl}/images/rahul-tanwar-portrait.jpg`,
      jobTitle: "Founder and Entrepreneur",
      description:
        "Dubai-based multi-industry founder building ventures across gaming, beverages, apparel and manufacturing in the UAE and India.",
      sameAs: [content.socialLinks.linkedin].filter(
        (url): url is string => typeof url === "string" && url.startsWith("https://"),
      ),
      knowsAbout: [
        "Entrepreneurship",
        "Gaming",
        "Consumer brands",
        "Apparel",
        "Textile manufacturing",
        "UAE and India business",
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: `${siteUrl}/`,
      name: "Rahul Tanwar",
      inLanguage: "en",
      publisher: { "@id": personId },
    },
    {
      "@type": isHome ? "ProfilePage" : "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: content.metaTitle || content.pageTitle,
      description: content.metaDescription,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      mainEntity: isHome ? { "@id": personId } : undefined,
      inLanguage: "en",
      dateModified: content.updatedAt,
    },
  ];

  if (isHome) {
    graph.push({
      "@type": "Quotation",
      text: BUSINESS_PHILOSOPHY_QUOTE,
      spokenByCharacter: {
        "@type": "Person",
        name: "Rahul Tanwar",
        jobTitle: "Founder and Entrepreneur",
        url: siteUrl,
        worksFor: { "@type": "Organization", name: "Rahul Tanwar Ventures" },
      },
    });
  } else {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: content.pageTitle.split(/[|—-]/)[0].trim(),
          item: pageUrl,
        },
      ],
    });
  }

  graph.push(...(content.jsonLd || []));
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/ /g, "\\u2028")
    .replace(/ /g, "\\u2029");
}
```

- [ ] **Step 5: Implement `src/server/content.ts`**

```ts
import { cache } from "react";
import { getDefaultContent, mergeContent, type PageCmsContent } from "@/lib/cms";
import { getStore } from "./store";

export const getPageContent = cache(async (slug: string): Promise<PageCmsContent> => {
  const defaults = getDefaultContent(slug);
  if (!defaults) throw new Error(`Unknown page slug: ${slug}`);
  try {
    const pages = await getStore().readPages();
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    return mergeContent(defaults, page as Partial<PageCmsContent> | undefined);
  } catch (error) {
    console.error(`[content] failed to load "${slug}" from storage; using defaults`, error);
    return defaults;
  }
});
```

- [ ] **Step 6: Run the whole suite**

Run: `npx vitest run`
Expected: all PASS. (`cms.ts` imports `data.ts`, which imports image files; Vitest resolves them as asset URL strings, so no extra setup.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: server-side SEO builders and CMS content loader" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Views, client boundary and asset imports (typecheck green)

**Files:**
- Move/modify: `src/routes/index.tsx` → `src/views/HomeView.tsx`; `src/routes/privacy.tsx` → `src/views/PrivacyView.tsx`; `src/routes/ventures/VentureDetailPage.tsx` → `src/views/VentureView.tsx`
- Delete: `src/routes/__root.tsx`, `src/routes/ventures/{adatto,arnika-textiles,delhi-6,masai,sr18-gaming,volt-50000}.tsx`, `src/main.tsx`, `src/router.tsx`, `src/routeTree.gen.ts`
- Modify: `src/lib/data.ts:1-37`, `src/components/site/EditorialVisual.tsx:1-10 + usages`, `tsconfig.json` (drop the 4 temporary excludes)

**Interfaces:**
- Produces: `export function HomeView(props: { content: PageCmsContent })`, `export function PrivacyView(props: { content: PageCmsContent })`, `export function VentureView(props: { slug: string; content: PageCmsContent })` — each file starts with `"use client";`.
- Produces: `IMG` values and `VENTURES[].image` are plain URL strings again.

- [ ] **Step 1: Move the route files into `src/views/`**

```bash
mkdir -p src/views
git mv src/routes/index.tsx src/views/HomeView.tsx
git mv src/routes/privacy.tsx src/views/PrivacyView.tsx
git mv src/routes/ventures/VentureDetailPage.tsx src/views/VentureView.tsx
git rm -f src/routes/__root.tsx src/routes/ventures/adatto.tsx src/routes/ventures/arnika-textiles.tsx src/routes/ventures/delhi-6.tsx src/routes/ventures/masai.tsx src/routes/ventures/sr18-gaming.tsx src/routes/ventures/volt-50000.tsx src/main.tsx src/router.tsx src/routeTree.gen.ts
```

- [ ] **Step 2: Edit `src/views/HomeView.tsx`**

- Insert `"use client";` + blank line as the very first lines.
- Delete `import { createFileRoute } from "@tanstack/react-router";`.
- Change the cms import to `import { BUSINESS_PHILOSOPHY_QUOTE, type PageCmsContent } from "@/lib/cms";`.
- Delete the line `export const Route = createFileRoute("/")({ component: Index });`.
- Replace
  ```tsx
  export function Index() {
    const content = usePageContent("home");
  ```
  with
  ```tsx
  export function HomeView({ content }: { content: PageCmsContent }) {
  ```
- Add the stylesheet imports order guard: keep the four `@/home-*.css` imports as they are.

- [ ] **Step 3: Edit `src/views/PrivacyView.tsx`**

- Insert `"use client";` + blank line first.
- Delete the `createFileRoute` import and the `export const Route = ...` line.
- Change `import { usePageContent } from "@/lib/cms";` → `import type { PageCmsContent } from "@/lib/cms";`.
- Replace
  ```tsx
  export function PrivacyPage() {
    const content = usePageContent("privacy");
  ```
  with
  ```tsx
  export function PrivacyView({ content }: { content: PageCmsContent }) {
  ```

- [ ] **Step 4: Edit `src/views/VentureView.tsx`**

- Insert `"use client";` + blank line first.
- Change `import { usePageContent } from "@/lib/cms";` → `import type { PageCmsContent } from "@/lib/cms";`.
- Replace
  ```tsx
  export function VentureDetailPage({ slug }: { slug: string }) {
    const content = usePageContent(slug);
  ```
  with
  ```tsx
  export function VentureView({ slug, content }: { slug: string; content: PageCmsContent }) {
  ```

- [ ] **Step 5: Fix static image imports in `src/lib/data.ts`**

Replace lines 1–8 with:

```ts
import founderImage from "@/assets/founder-provided.png";
import factoryImage from "@/assets/factory.jpg";
import beverageImage from "@/assets/beverage.jpg";
import gamingImage from "@/assets/gaming.jpg";
import apparelImage from "@/assets/apparel.jpg";
import dubaiImage from "@/assets/dubai.jpg";

// Next.js static imports are objects ({ src, width, height }); the site only needs the URL.
// Under Vitest (Vite) the import is already a URL string, so fall back to it.
const url = (image: unknown): string =>
  typeof image === "string" ? image : ((image as { src?: string })?.src ?? "");

const founder = url(founderImage);
const factory = url(factoryImage);
const beverage = url(beverageImage);
const gaming = url(gamingImage);
const apparel = url(apparelImage);
const dubai = url(dubaiImage);

export const IMG = { founder, factory, beverage, gaming, apparel, dubai };
```
(The rest of the file keeps using the lower-case names `gaming`, `beverage`, etc.)

- [ ] **Step 6: Fix static image imports in `src/components/site/EditorialVisual.tsx`**

Replace lines 3–7 (the five `@/assets/*` imports) with:

```ts
import adattoImage from "@/assets/adatto.avif";
import sr18Image from "@/assets/sr18.avif";
import voltImage from "@/assets/volt.avif";
import textileImage from "@/assets/textile.avif";
import delhi6Image from "@/assets/delhi6.jpeg";

const url = (image: unknown): string =>
  typeof image === "string" ? image : ((image as { src?: string })?.src ?? "");

const adattoPhoto = url(adattoImage);
const sr18Photo = url(sr18Image);
const voltPhoto = url(voltImage);
const textilePhoto = url(textileImage);
const delhi6Photo = url(delhi6Image);
```
(The existing `import` for `@/lib/data` / types on lines 1–2 stays above.)

- [ ] **Step 7: Remove the temporary tsconfig excludes**

In `tsconfig.json` set `"exclude": ["node_modules", ".next", "dist-cpanel", "server"]`.

- [ ] **Step 8: Remove the now-unused Vite/TanStack leftovers referenced by types**

Run: `grep -rn "vite/client\|@tanstack\|import.meta" src app --include=*.ts --include=*.tsx`
Expected: no matches. Fix any that remain (none are expected after Steps 1–4 and Task 6).

- [ ] **Step 9: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0. Fix real errors only (for example a stray `string`-typed image prop); do not loosen `strict`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: move route components to client views, fix image imports for Next" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Root layout, page-transition curtain, fonts

**Files:**
- Modify: `app/layout.tsx`
- Create: `src/components/site/PageTransitions.tsx`, `src/components/site/JsonLd.tsx`, `src/components/site/PageCurtain.tsx`
- Modify: `src/lib/pageTransition.ts` (idempotent init)

**Interfaces:**
- Produces: `PageTransitions` (client, no props); `PageCurtain` (server-safe markup); `JsonLd({ data }: { data: unknown })` (server component rendering `<script type="application/ld+json">` via `serializeJsonLd`).

- [ ] **Step 1: Make `initPageTransitions` idempotent**

In `src/lib/pageTransition.ts` add above `export function initPageTransitions()`:

```ts
let initialised = false;
```
and make the first line of the function body:

```ts
  if (initialised) return;
  initialised = true;
```

- [ ] **Step 2: Create `src/components/site/PageTransitions.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPageTransitions } from "@/lib/pageTransition";

export function PageTransitions() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  useEffect(() => {
    if (!isAdmin) initPageTransitions();
  }, [isAdmin]);
  return null;
}
```

- [ ] **Step 3: Create `src/components/site/PageCurtain.tsx`**

```tsx
const BOOT = `try{var n=sessionStorage.getItem("rt-page-transition");if(n&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("rt-page-entering");document.querySelector("[data-curtain-label]").textContent=n;setTimeout(function(){document.documentElement.classList.remove("rt-page-entering")},4500)}}catch(e){}`;

export const CURTAIN_CRITICAL_CSS = `
.rt-curtain { position: fixed; inset: 0; z-index: 2000; visibility: hidden; pointer-events: none; }
.rt-curtain-panel { position: absolute; inset: 0; background: #171a18; transform: translateY(112%); }
.rt-curtain-edge { position: absolute; left: 0; width: 100%; height: 100px; fill: #171a18; }
html.rt-page-entering .rt-curtain { visibility: visible; }
html.rt-page-entering .rt-curtain-panel { transform: none; }
`;

export function PageCurtain() {
  return (
    <>
      <div className="rt-curtain" data-page-curtain aria-hidden="true">
        <div className="rt-curtain-panel" data-curtain-panel>
          <svg
            className="rt-curtain-edge rt-curtain-edge--top"
            data-curtain-edge-top
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0 120 C300 0 1140 0 1440 120 Z" />
          </svg>
          <span className="rt-curtain-label" data-curtain-label suppressHydrationWarning />
          <svg
            className="rt-curtain-edge rt-curtain-edge--bottom"
            data-curtain-edge-bottom
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H1440 C1140 120 300 120 0 0 Z" />
          </svg>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
    </>
  );
}
```

- [ ] **Step 4: Create `src/components/site/JsonLd.tsx`**

```tsx
import { serializeJsonLd } from "@/server/seo";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
```

- [ ] **Step 5: Write `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from "next";
import "../src/styles.css";
import { CURTAIN_CRITICAL_CSS, PageCurtain } from "@/components/site/PageCurtain";
import { PageTransitions } from "@/components/site/PageTransitions";
import { getSiteUrl } from "@/server/env";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#f9f8f5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=Noto+Sans+Devanagari:wght@400;500&display=swap"
        />
        <style dangerouslySetInnerHTML={{ __html: CURTAIN_CRITICAL_CSS }} />
      </head>
      <body>
        <PageCurtain />
        {children}
        <PageTransitions />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: root layout with fonts, transition curtain and JSON-LD helper" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Pages, admin, sitemap, robots, 404 and error

**Files:**
- Modify: `app/page.tsx`
- Create: `app/privacy/page.tsx`, `app/ventures/[slug]/page.tsx`, `app/admin/[[...slug]]/page.tsx`, `app/admin/AdminClient.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/not-found.tsx`, `app/error.tsx`
- Delete: `public/sitemap.xml`, `public/robots.txt`, `public/_redirects`

**Interfaces:**
- Consumes: `getPageContent`, `buildMetadata`, `buildJsonLd`, `JsonLd`, views, `VENTURE_SLUGS`, `PAGE_SLUGS`.

- [ ] **Step 1: `app/page.tsx`**

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { HomeView } from "@/views/HomeView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageContent("home"));
}

export default async function Page() {
  const content = await getPageContent("home");
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <HomeView content={content} />
    </>
  );
}
```

- [ ] **Step 2: `app/privacy/page.tsx`**

```tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { PrivacyView } from "@/views/PrivacyView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageContent("privacy"));
}

export default async function Page() {
  const content = await getPageContent("privacy");
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <PrivacyView content={content} />
    </>
  );
}
```

- [ ] **Step 3: `app/ventures/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { VENTURE_SLUGS } from "@/lib/slugs";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { VentureView } from "@/views/VentureView";

export const revalidate = 60;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VENTURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!(VENTURE_SLUGS as readonly string[]).includes(slug)) return {};
  return buildMetadata(await getPageContent(slug));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!(VENTURE_SLUGS as readonly string[]).includes(slug)) notFound();
  const content = await getPageContent(slug);
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <VentureView slug={slug} content={content} />
    </>
  );
}
```

- [ ] **Step 4: Admin (client-only because `AdminApp` reads `window`/`localStorage` during render)**

`app/admin/AdminClient.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/admin/AdminApp").then((m) => m.AdminApp), {
  ssr: false,
});

export function AdminClient() {
  return <AdminApp />;
}
```

`app/admin/[[...slug]]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AdminClient } from "../AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function Page() {
  return <AdminClient />;
}
```

- [ ] **Step 5: `app/sitemap.ts` and `app/robots.ts`**

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { PAGE_SLUGS } from "@/lib/slugs";
import { getSiteUrl } from "@/server/env";
import { getStore } from "@/server/store";

export const revalidate = 3600;

const META: Record<string, { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }> = {
  home: { path: "/", changeFrequency: "weekly", priority: 1 },
  privacy: { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let pages: Record<string, Record<string, unknown>> = {};
  try {
    pages = await getStore().readPages();
  } catch (error) {
    console.error("[sitemap] storage unavailable, using defaults", error);
  }
  return PAGE_SLUGS.map((slug) => {
    const meta = META[slug] ?? { path: `/ventures/${slug}`, changeFrequency: "monthly" as const, priority: 0.8 };
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    const updated = typeof page?.updatedAt === "string" ? new Date(page.updatedAt) : new Date();
    return {
      url: (typeof page?.canonicalUrl === "string" && page.canonicalUrl) || `${base}${meta.path}`,
      lastModified: Number.isNaN(updated.getTime()) ? new Date() : updated,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    };
  });
}
```

`app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: `app/not-found.tsx` and `app/error.tsx`** (ported from the old `__root.tsx`)

`app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[22px] font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-[22px] font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-[14px] text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

`app/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Remove public files that now conflict with route handlers**

```bash
git rm -f public/sitemap.xml public/robots.txt public/_redirects
```

- [ ] **Step 8: Build and typecheck**

Run: `npx tsc --noEmit && npx next build`
Expected: both exit 0; the build output lists `/`, `/privacy`, `/ventures/[slug]` (6 prerendered), `/admin/[[...slug]]`, `/sitemap.xml`, `/robots.txt`, and the API routes. Fix build errors that are real (for example, a client-only API touched during server render). Do not add `ssr:false` to the home sections unless a specific component crashes on the server; if one does, wrap only that component in `next/dynamic` with `ssr: false` and note it in the commit message.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: App Router pages, admin, sitemap, robots, 404 and error boundary" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Remove Vite/Express code and dependencies; docs

**Files:**
- Delete: `server/`, `index.html`, `vite.config.ts`, `.env.example` (rewritten in Task 11), root duplicate images only if unreferenced (see Step 3)
- Modify: `package.json` (deps), `README.md`, `components.json`

- [ ] **Step 1: Delete Express and Vite files**

```bash
git rm -r -f server index.html vite.config.ts
```

- [ ] **Step 2: Uninstall dead dependencies**

```bash
npm uninstall @tanstack/react-router @tanstack/router-plugin @tanstack/react-query @tailwindcss/vite @vitejs/plugin-react vite vite-tsconfig-paths express cors helmet dotenv express-rate-limit jsonwebtoken @types/cors @types/jsonwebtoken eslint-plugin-react-refresh
```
Then remove the `react-refresh` import, plugin entry and rule from `eslint.config.mjs`.

- [ ] **Step 3: Check the root-level duplicate images**

Run: `grep -rn "adatto.avif\|consunl.avif\|delhi6.jpeg\|rahul-tanwar-founder.png\|sr18.avif\|techonolgy.avif\|textile.avif\|volt.avif" app src content public scripts README.md | grep -v "src/assets"`
Expected: if there are no matches outside `src/assets`, the root copies are unreferenced — leave them in place and mention them in the final report (do not delete user files). If there are matches, leave them.

- [ ] **Step 4: `components.json`**

Set `"rsc": true`.

- [ ] **Step 5: Rewrite the top of `README.md`**

Replace the first paragraph ("React 19 + Vite portfolio. … are unchanged.") with:

```md
Next.js (App Router) + React 19 + Tailwind CSS v4 portfolio. V6 rebuilds the homepage hero and animates every
story section with components ported from **React Bits**, **Animate UI**, **Inspira UI** and **motion-primitives**,
running on **GSAP**, **Motion (framer-motion)**, **anime.js v4**, **three.js** and **Lenis**. The CMS, admin, contact form,
chat and SEO now run as Next.js route handlers and metadata (no separate Express server). See `DEPLOY.md` to deploy to Vercel or cPanel.

```
npm install
npm run dev        # http://localhost:3000
npm test           # server logic tests (Vitest)
npm run build && npm start
```
```
In the "Notes on the choices" section, replace the Barba bullet's mention of `index.html` with "The curtain markup sits in `app/layout.tsx` (`PageCurtain`) so it covers the first paint".

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0. For lint, compare with the Task 1 baseline: error count must not exceed the baseline; fix errors in files you created or modified, and report (do not fix) pre-existing ones.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove Vite, TanStack Router and Express; update README" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Deployment artifacts (Vercel + cPanel)

**Files:**
- Create: `.env.example`, `cpanel/app.js`, `scripts/package-cpanel.mjs`, `DEPLOY.md`, `data/.gitkeep` (not committed; see `.gitignore`) — create `data/` only at runtime

**Interfaces:**
- Produces: `npm run package:cpanel` → `dist-cpanel/` containing `app.js` (Passenger startup), `server.js` (Next standalone), `.next/static`, `public`, `data/`.

- [ ] **Step 1: `.env.example`**

```
# --- Required in production (both Vercel and cPanel) ---
SITE_URL=https://rahultanwar.com
JWT_SECRET=replace-with-a-long-random-secret-at-least-16-chars
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password

# --- Contact form (SMTP) ---
CONTACT_TO_EMAIL=hello@rahultanwar.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-user
SMTP_PASS=smtp-password
SMTP_FROM="Rahul Tanwar Website <no-reply@rahultanwar.com>"

# --- Chat assistant (optional) ---
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4.1-mini

# --- CMS storage ---
# Vercel: add the Upstash Redis integration (Marketplace); it injects these two.
KV_REST_API_URL=
KV_REST_API_TOKEN=
# cPanel / any Node host: leave Redis empty; edits are saved as JSON files in DATA_DIR.
# DATA_DIR=./data
```

- [ ] **Step 2: `cpanel/app.js`**

```js
// Passenger startup file for cPanel "Setup Node.js App".
process.env.NODE_ENV = process.env.NODE_ENV || "production";
// cPanel sets HOSTNAME to the machine name, which Next would try to bind to.
process.env.HOSTNAME = "0.0.0.0";
require("./server.js");
```

- [ ] **Step 3: `scripts/package-cpanel.mjs`**

```js
import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist-cpanel");
const standalone = path.join(root, ".next", "standalone");

try {
  await access(path.join(standalone, "server.js"));
} catch {
  console.error("Missing .next/standalone/server.js — run `npm run build` first.");
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await cp(standalone, out, { recursive: true });
await mkdir(path.join(out, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(out, ".next", "static"), { recursive: true });
await cp(path.join(root, "public"), path.join(out, "public"), { recursive: true });
await cp(path.join(root, "cpanel", "app.js"), path.join(out, "app.js"));
await mkdir(path.join(out, "data"), { recursive: true });
await writeFile(path.join(out, "data", ".gitkeep"), "");

console.log("cPanel bundle ready in dist-cpanel/. Zip its contents and upload (see DEPLOY.md).");
```

- [ ] **Step 4: `DEPLOY.md`**

Write a document with exactly these sections (concise, runnable commands):

1. **Environment variables** — table of every var in `.env.example`, which are required, and which target uses them.
2. **Vercel** — import the repo; Framework preset "Next.js"; Marketplace → add *Upstash Redis* to the project (it injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`); set the required vars in Project Settings → Environment Variables; deploy; first admin save writes to Redis (content before that is the bundled seed). Note: without Redis, the site works read-only and admin saves return 503.
3. **cPanel (Node.js app)** — requirements: Node ≥ 20.9 in "Setup Node.js App". Steps: `npm ci && npm run build && npm run package:cpanel` (build on Linux/WSL/CI if Windows fails creating standalone symlinks — or build on the server over SSH); zip `dist-cpanel/*` contents; upload to the app root (e.g. `~/rahultanwar-app`); in "Setup Node.js App": create app, Application root = that folder, Application URL = domain, Startup file = `app.js`, mode Production; add the env vars in the UI (or an `.env` file in the app root); Restart. Ensure `data/` is writable (`chmod 755`). Content edits are saved to `data/*.json` — back this folder up and never overwrite it when re-deploying (upload everything except `data/`).
4. **Updating** — Vercel: push to the branch. cPanel: rebuild, upload everything except `data/` and `.env`, Restart.
5. **Verifying** — `curl -s https://<domain>/sitemap.xml`, `curl -s https://<domain>/api/public/pages/home`, `/admin` login.
6. **Limits** — in-memory rate limiting on cPanel is per-process and resets on restart; Vercel uses Redis-backed limits; CORS is same-origin only (no `CORS_ORIGIN`).

- [ ] **Step 5: Build the cPanel bundle and boot it the way Passenger would**

```bash
npm run build && npm run package:cpanel
cd dist-cpanel && PORT=3200 JWT_SECRET=test-secret-test-secret ADMIN_EMAIL=a@b.co ADMIN_PASSWORD=x node app.js
```
(run the server in the background), then from another shell:
`curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3200/` → `200`; `curl -s http://localhost:3200/api/public/pages/home | head -c 120` → JSON starting `{"page":`; `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3200/_next/static/` is not required — instead fetch one CSS/JS URL found in the home HTML and confirm `200`. Stop the server.
Expected: all as stated. If standalone creation fails on Windows with `EPERM` symlink errors, record it, run the build in WSL/Linux or on the server, and keep the DEPLOY.md note.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Vercel and cPanel deployment support (standalone bundle, docs, env)" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: End-to-end verification

**Files:** none created; fixes only if verification finds defects (each fix gets its own commit).

- [ ] **Step 1: Clean build and test run**

```bash
rm -rf .next && npm run typecheck && npm run lint && npm test && npm run build
```
Expected: all exit 0.

- [ ] **Step 2: Run production server with a temp data dir**

```bash
DATA_DIR="$TEMP/rt-e2e-data" JWT_SECRET=e2e-secret-e2e-secret ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pw SITE_URL=http://localhost:3300 npx next start -p 3300
```
(background.) Then check:

- `for p in / /privacy /ventures/sr18-gaming /ventures/delhi-6 /ventures/volt-50000 /ventures/masai /ventures/adatto /ventures/arnika-textiles /admin /admin/pages; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3300$p)"; done` → all `200`.
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3300/ventures/nope` → `404`.
- `curl -s http://localhost:3300/ | grep -o '<title>[^<]*</title>'` → the home title; `grep -c 'application/ld+json'` ≥ 1; `grep -o 'rel="canonical"[^>]*'` present.
- `curl -s http://localhost:3300/sitemap.xml | grep -c '<loc>'` → `8`; `curl -s http://localhost:3300/robots.txt` lists the sitemap.
- Admin flow: `TOKEN=$(curl -s -X POST localhost:3300/api/admin/login -d '{"email":"admin@example.com","password":"pw"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')`; `curl -s -X PUT localhost:3300/api/admin/pages/home -H "authorization: Bearer $TOKEN" -d '{"pageTitle":"E2E Title","metaTitle":"E2E Title"}'`; wait ≤ 2 s, then `curl -s localhost:3300/ | grep -o '<title>[^<]*</title>'` → `E2E Title` (proves `revalidatePath` works); `ls "$TEMP/rt-e2e-data"` shows `pages.json`.
- Error paths: `curl -s -X POST localhost:3300/api/contact -d '{oops'` → 400 JSON; `curl -s -X POST localhost:3300/api/contact -d '{"name":"Ada Lovelace","email":"a@b.co","service":"Other enquiry","message":"hello there friend"}'` → 503 JSON (SMTP unset); `curl -s -X POST localhost:3300/api/chat -d '{"message":"hi there"}'` → 503 JSON; `curl -s -o /dev/null -w '%{http_code}' localhost:3300/api/admin/dashboard` → 401.

- [ ] **Step 3: Browser pass**

Load the `claude-in-chrome` skill, then open `http://localhost:3300/` and verify, with the console open (`read_console_messages`, pattern `error|warn|hydrat`): no hydration errors; hero renders; page scroll animations run; nav click on a venture triggers the curtain and lands on the venture page; "All ventures" link returns to `/#ventures`; contact form shows the error message (SMTP unset) without crashing; `/admin` shows the login, logs in with the e2e credentials, loads the dashboard and saves a page. Repeat the home load with `prefers-reduced-motion: reduce` emulated and confirm content is static and readable. Capture screenshots of home, a venture page and the admin dashboard.

- [ ] **Step 4: Vercel-mode check**

Stop the server, then `VERCEL=1 JWT_SECRET=e2e-secret-e2e-secret ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=pw npx next start -p 3301`: confirm `/` returns 200 and an admin `PUT` returns 503 with a storage message. Stop the server.

- [ ] **Step 5: Report**

Summarise results with evidence (commands and outputs): what passed, anything skipped (for example real SMTP/OpenAI/Redis/Vercel/cPanel deploys cannot be exercised locally), the pre-existing lint findings, and the root-level duplicate images left untouched. Do not claim Vercel or cPanel deployment is verified — only that the artifacts build and run locally in both modes.

- [ ] **Step 6: Final commit (if fixes were made)**

```bash
git status --short
git add -A && git commit -m "fix: issues found during end-to-end verification" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
