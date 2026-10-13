# Deploying

The site is a Next.js (App Router) app. It deploys to Vercel as-is, or to cPanel "Setup Node.js App"
(Passenger) as a self-contained `standalone` bundle (`next.config.ts` sets `output: "standalone"`).

## 1. Environment variables

Copy `.env.example` to `.env.local` for local work (not `.env`: Next copies `.env` and `.env.production` into the standalone build, and the cPanel packaging script strips them). In production set them in the host's UI.

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `SITE_URL` | Recommended | Vercel, cPanel | Canonical origin for sitemap, robots and metadata. Defaults to `https://rahultanwar.com`. **Must also be set at BUILD time**: `robots.txt`, the sitemap and `metadataBase` are baked in during `next build` (on cPanel, set it in the shell that runs `npm run build`). |
| `JWT_SECRET` | Yes | Vercel, cPanel | Admin session signing key. At least 16 characters in production. |
| `ADMIN_EMAIL` | Yes | Vercel, cPanel | Admin login email. |
| `ADMIN_PASSWORD` | Yes | Vercel, cPanel | Admin login password. |
| `CONTACT_TO_EMAIL` | For contact form | Vercel, cPanel | Recipient of contact-form messages. |
| `SMTP_HOST` | For contact form | Vercel, cPanel | SMTP server. |
| `SMTP_PORT` | For contact form | Vercel, cPanel | Default `587`. |
| `SMTP_SECURE` | For contact form | Vercel, cPanel | `true` for implicit TLS (port 465), otherwise `false`. |
| `SMTP_USER` | For contact form | Vercel, cPanel | SMTP username. |
| `SMTP_PASS` | For contact form | Vercel, cPanel | SMTP password. |
| `SMTP_FROM` | No | Vercel, cPanel | From header. Falls back to `SMTP_USER`. |
| `OPENAI_API_KEY` | For chat assistant | Vercel, cPanel | Chat is unavailable without it. |
| `OPENAI_MODEL` | No | Vercel, cPanel | Default `gpt-4.1-mini`. |
| `KV_REST_API_URL` | Vercel: yes for admin saves | Vercel, cPanel, any host | Upstash Redis REST URL. Injected by the Vercel integration, but usable on any host (it then replaces the `data/` folder and gives shared rate limits). `UPSTASH_REDIS_REST_URL` is also accepted. |
| `KV_REST_API_TOKEN` | Vercel: yes for admin saves | Vercel, cPanel, any host | Upstash Redis REST token. Injected by the Vercel integration, usable on any host. `UPSTASH_REDIS_REST_TOKEN` is also accepted. |
| `DATA_DIR` | No | cPanel | Folder for CMS JSON files. Default `./data` (relative to the app root). Used only when Redis is not configured and not on Vercel. |
| `TRUST_PROXY_HOPS` | No | cPanel, other hosts | Number of trusted reverse proxies in front of the app, used to pick the client IP for rate limiting from `X-Forwarded-For` (Nth entry from the right). Default `1` (the rightmost entry, i.e. what the one proxy appended). `0` ignores `X-Forwarded-For` and uses `X-Real-IP`. Ignored on Vercel, which uses `x-real-ip`. **On cPanel, confirm what Apache/Passenger actually sends** (e.g. `curl -s -H 'X-Forwarded-For: 6.6.6.6' https://<domain>/api/...` and check which header carries the real address); if the proxy adds no `X-Forwarded-For`, every visitor shares one rate-limit bucket. |

## 2. Vercel

1. Import the repository in Vercel. Framework preset: **Next.js**.
2. In **Marketplace**, add **Upstash Redis** to the project. It injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. In **Project Settings -> Environment Variables**, set `SITE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   and the SMTP / OpenAI variables you need.
4. Deploy. Content is the bundled seed (`content/*.json`) until the first admin save, which writes to Redis.

Without Redis the site works read-only (it serves the bundled seed) and admin saves return 503.

With Redis configured, the public pages read CMS content through Next's Data Cache (60 s, tag `cms`), so pages stay
statically generated / ISR instead of rendering on every request. Admin saves purge it immediately
(`revalidatePath` + `revalidateTag("cms")`); worst case a change shows up within the 60 s cache window.

## 3. cPanel (Node.js app)

Requirements: Node >= 20.9 available in **Setup Node.js App**.

1. Build the bundle:

   ```bash
   npm ci && npm run build && npm run package:cpanel
   ```

   This produces `dist-cpanel/` (`app.js`, `server.js`, `.next/static`, `public`, `data/`, `node_modules`).
   If `next build` fails on Windows while creating the standalone output (symlink / `EPERM` errors), build on
   Linux, in WSL or in CI instead, or build on the server over SSH.
2. Zip the **contents** of `dist-cpanel/` (not the folder itself) and upload them to the app root,
   e.g. `~/rahultanwar-app`, then extract.
3. In cPanel -> **Setup Node.js App** -> **Create Application**:
   - Node.js version: 20.9 or newer
   - Application mode: **Production**
   - Application root: the folder from step 2 (e.g. `rahultanwar-app`)
   - Application URL: your domain
   - Application startup file: `app.js`
4. Add the environment variables from section 1 in the app's UI (or put an `.env` file in the app root on the
   server). The bundle never contains a `.env*` file: `npm run package:cpanel` removes any it finds and prints a warning.
5. Make sure `data/` is writable: `chmod 755 ~/rahultanwar-app/data`. The bundle's `data/` only contains a
   `.gitkeep`; local `data/*.json` from development is stripped, so extracting the bundle can never overwrite real
   CMS edits.
6. Click **Restart**.

**Passenger / CloudLinux notes:**

- Do **not** click **Run NPM Install** in Setup Node.js App. The bundle already ships its own `node_modules`, so an
  install is unnecessary.
- CloudLinux's Node selector expects the app's `node_modules` to be a **symlink** to its own virtual environment. If
  the panel pre-created a `node_modules` symlink/folder, remove it before extracting the bundle (or avoid creating
  one), so the bundled `node_modules` directory is the one used.
- The app sits behind Apache/Passenger. Rate limiting keys on the client IP taken from `X-Forwarded-For`; see
  `TRUST_PROXY_HOPS` in section 1 and confirm what your host's proxy actually sends.

Content edits are saved to `data/*.json`. Back this folder up and never overwrite it when re-deploying
(upload everything except `data/`).

## 4. Updating

- **Vercel:** push to the deployed branch.
- **cPanel:** rebuild (`npm run build && npm run package:cpanel`), upload everything from `dist-cpanel/`
  **except `data/` and `.env`**, then **Restart** the app.

## 5. Verifying

```bash
curl -s https://<domain>/sitemap.xml
curl -s https://<domain>/api/public/pages/home
```

Then open `https://<domain>/admin` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## 6. Limits

- **Rate limiting:** limits are Redis-backed when Redis is configured; otherwise they are per-process in memory
  and reset on restart. If Redis errors at runtime the limiter degrades to the in-memory one rather than allowing
  all requests.
- **Corrupt data files:** if `data/pages.json` (or another file) is not valid JSON, public pages keep rendering
  the bundled seed, but admin saves return `503` with a message naming the file and nothing is overwritten. Fix or
  remove the file, then save again.
- **CORS:** same-origin only. There is no `CORS_ORIGIN` setting.
- **Concurrent admin saves:** a save is a whole-document read-modify-write with no locking, so two simultaneous
  admin saves can drop one of the edits. This is the same as the old Express server and is acceptable for a
  single-admin CMS.
- **cPanel data is the only copy:** on cPanel `data/*.json` is the only copy of CMS edits (the bundled seed is
  just the starting point). Back it up regularly and never overwrite it on redeploy.

## 7. Migrating from the old Express server

- **cPanel / file storage:** copy the old `server/data/pages.json`, `settings.json` and `media.json` into the new
  app's `data/` folder (it must be writable).
- **Redis:** import the same documents (as JSON) into the keys `rt-cms:pages`, `rt-cms:settings` and `rt-cms:media`.
- Old saved pages may reference image URLs from the removed Vite build (`/assets/*-<hash>.*`) that no longer exist.
  Re-select those images in the admin.
- The 8 duplicate images in the repository root (`*.avif`, `*.jpeg`, `rahul-tanwar-founder.png`) are unused.
