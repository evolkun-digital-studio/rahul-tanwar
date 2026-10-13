# Next.js App Router migration — design

Date: 2026-10-13
Status: approved in conversation, pending written-spec review

## Goal

Convert the portfolio from a Vite SPA (hand-rolled router in `src/main.tsx`, TanStack Router
files, separate Express server in `server/`) into a single **Next.js App Router** application in
TSX with **Tailwind CSS v4**. The result must be production-ready for **Vercel** and for **cPanel
(Node.js app / Passenger)**.

## Success criteria

- Every current route renders and looks/behaves the same: `/`, `/privacy`, six
  `/ventures/*` pages, `/admin`.
- All animation behaviour is preserved (GSAP, Lenis, Motion, anime.js, three.js hero, page
  transition curtain, `prefers-reduced-motion`).
- Express is gone. Public, contact, chat and admin APIs run as Next Route Handlers with the same
  request/response shapes, so `AdminApp` and the contact form work unchanged.
- SEO is server-rendered per page: title, description, OG, Twitter, canonical, JSON-LD `@graph`,
  `sitemap.xml`, `robots.txt`.
- CMS edits persist on both targets (see Storage).
- `tsc --noEmit`, `eslint`, and `next build` pass; `next start` serves every route and API.

## Non-goals

- No visual redesign, no copy changes.
- No switch to soft client-side navigation for page transitions (follow-up).
- No move of admin auth to cookies (follow-up). Same JWT Bearer flow.
- No DB beyond the small CMS document store.

## Assumptions

- The cPanel host offers "Setup Node.js App" (Passenger). Plain static hosting cannot serve the
  APIs and is out of scope.
- Tailwind v4 and `src/styles.css` carry over; only the build plugin changes.

## Architecture

```
app/
  layout.tsx                  Google Fonts links, global CSS, transition curtain, client providers
  page.tsx                    home: server component fetches CMS, renders client sections
  privacy/page.tsx
  ventures/[slug]/page.tsx    generateStaticParams for 6 slugs, notFound() otherwise
  admin/[[...slug]]/page.tsx  client AdminApp, robots noindex
  api/public/pages/[slug]/route.ts
  api/public/settings/route.ts
  api/contact/route.ts
  api/chat/route.ts
  api/admin/login/route.ts
  api/admin/dashboard/route.ts
  api/admin/pages/[slug]/route.ts      GET, PUT
  api/admin/media/route.ts             GET, POST
  api/admin/settings/route.ts          GET, PUT
  sitemap.ts  robots.ts  not-found.tsx  error.tsx
src/                          existing components, lib, css (kept; alias @/* stays)
src/server/                   env, store, auth, ratelimit, seo (server-only)
content/                      seed pages.json / settings.json / media.json (moved from server/data)
```

- **Tailwind:** `@tailwindcss/postcss` + `postcss.config.mjs` replace `@tailwindcss/vite`.
  `@source` in `styles.css` is repointed at the new layout.
- **Rendering:** page routes are server components that load CMS content through the store
  (public reads go through `unstable_cache`, 60 s, tag `cms`, so pages stay static/ISR even with the Redis
  client's `no-store` fetch; admin saves call `revalidatePath` and `revalidateTag("cms")`), merge it with the in-code defaults (`mergeContent` in `src/lib/cms.ts`),
  and pass it to client sections. `usePageContent` and its `fetch("/api/public/pages/…")` effect
  are removed; the client-side `applyPageSeo` DOM patching is replaced by `generateMetadata`.
- **Route components:** route page components stay client components (`src/views/*`) receiving `content` as a prop; `app/**/page.tsx` are server components that fetch content and render metadata/JSON-LD.
- **Client boundary:** every component using GSAP, Lenis, Motion, anime.js, three.js, hooks or
  browser APIs gets `"use client"`. `GridDistortion` (three.js) is loaded with
  `next/dynamic({ ssr: false })`, matching today's lazy desktop-only behaviour.
- **Page transitions:** the curtain markup from `index.html` moves into `layout.tsx`;
  `initPageTransitions()` runs from a small client component. Internal links remain plain
  anchors so the leave → navigate → enter flow is unchanged.
- **Assets:** `src/assets/*` imports (Vite string URLs) are adapted to Next's static-import
  objects (`.src`) or moved to `public/`. Root-level duplicate images are not touched.
- **SEO:** `generateMetadata` per route from CMS page data; shared JSON-LD graph ported from
  `server/index.js` (`sharedStructuredData`) into `src/server/seo.ts` and rendered as a
  `<script type="application/ld+json">`. `sitemap.ts` ports `public.js` route list and
  `lastmod`/canonical logic.
- **Fonts:** keep the Google Fonts `<link>` tags (DM Sans + Noto Sans Devanagari) from `index.html` in the root layout head; CSS references the literal family names, which `next/font` would rename.
- **Removed:** Vite, `@vitejs/plugin-react`, `vite-tsconfig-paths`, TanStack Router/router-plugin,
  `routeTree.gen.ts`, `src/router.tsx`, `src/main.tsx`, `index.html`, `server/`, express, cors,
  helmet, dotenv, express-rate-limit, jsonwebtoken. TanStack Query is dropped if no component
  still uses it.
- **Security headers:** `next.config.ts` `headers()` replaces helmet (HSTS, nosniff,
  frame-options, referrer-policy; CSP left off as today).

## Storage (CMS)

`src/server/store.ts` exposes `readPages / writePages / readSettings / writeSettings /
readMedia / writeMedia`, with two backends selected by env:

| Backend | Selected when | Target |
| --- | --- | --- |
| Upstash Redis (REST) | `KV_REST_API_URL` and `KV_REST_API_TOKEN` set (also accepts `UPSTASH_REDIS_REST_URL/TOKEN`) | Vercel (Marketplace integration) |
| JSON files in `DATA_DIR` (default `./data`) | otherwise | cPanel / any Node host |

- Empty storage falls back to the bundled seed in `content/`, so a fresh deploy is never blank.
- Writes merge as today (`{...existing, ...body, slug, updatedAt}`), then call
  `revalidatePath("/", "layout")`; pages use `export const revalidate = 60` as a safety net, so edits appear without a rebuild.
- File backend writes atomically (temp file + rename).
- On Vercel without Redis configured, admin writes return a clear 503 ("storage not configured")
  rather than failing silently.

## Server behaviour preserved / hardened

- **Contact:** same zod schema, honeypot (`website`), nodemailer, 503 when SMTP unconfigured.
- **Chat:** same schema, system prompt, OpenAI call; 503 when key missing.
- **Admin:** same login contract returning `{ token }`; 8h JWT via `jose`; Bearer check on all
  other admin routes; credential comparison is constant-time. In production, missing
  `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` fail requests with a 500 and log the reason
  (checked lazily so `next build` does not need secrets).
- **Rate limits:** contact 5/15min, chat 12/min, admin login 30/15min, keyed by client IP.
  Upstash Ratelimit when Redis is configured; in-memory sliding window otherwise (single-process
  cPanel). Documented limitation: in-memory is per-process.
- **Runtime:** all API routes pin `runtime = "nodejs"`.

## Deployment

- **Vercel:** zero-config. Env vars: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SITE_URL`,
  `CONTACT_TO_EMAIL`, `SMTP_*`, `OPENAI_*`, plus Redis vars from the Upstash integration.
- **cPanel:** `output: "standalone"`; `server.js` startup file for Passenger that sets
  `PORT`/`HOSTNAME` and requires the standalone server; `data/` must be writable. Build locally
  (or on the host) and upload `.next/standalone`, `.next/static`, `public`, `content`. No `sharp`
  dependency (site uses `<img>`; `images.unoptimized: true`).
- `.env.example` rewritten for both targets; `DEPLOY.md` documents each path step by step.

## Work order

1. Work on branch `next-migration`; the five uncommitted edits in the working tree are the
   starting point and are preserved.
2. Scaffold: `next.config.ts`, `tsconfig.json`, PostCSS, `app/layout.tsx`, scripts in
   `package.json`.
3. Move pages and components behind `"use client"`; replace CMS hook with server loading;
   adapt asset imports.
4. Port store, auth, rate limiting and API routes.
5. Metadata, JSON-LD, sitemap, robots; delete Vite/Express code; update README and env docs.
6. Verify: `tsc`, `eslint`, `next build`, `next start`, browser pass over every route and API
   (including admin login/save and contact error paths), reduced-motion check.

## Risks

- GSAP/ScrollTrigger and Lenis initialise on mount; SSR output must match first client render to
  avoid hydration warnings. Mitigation: keep animation setup inside effects, no `window` access
  during render.
- `src/lib/cms.ts` is ~780 lines mixing defaults, merge logic and a React hook; the hook is
  removed and the rest is kept as-is to limit blast radius.
- In-memory rate limiting on cPanel resets on process restart; acceptable for a portfolio site.
