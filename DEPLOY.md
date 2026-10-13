# Deploying

The site is a Next.js (App Router) app. It deploys to Vercel as-is, or to cPanel "Setup Node.js App"
(Passenger) as a self-contained `standalone` bundle (`next.config.ts` sets `output: "standalone"`).

## 1. Environment variables

Copy `.env.example` to `.env` for local work. In production set them in the host's UI.

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `SITE_URL` | Yes | Vercel, cPanel | Canonical origin for sitemap, robots and metadata. Defaults to `https://rahultanwar.com`. |
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
| `KV_REST_API_URL` | Vercel: yes for admin saves | Vercel | Injected by the Upstash Redis integration. `UPSTASH_REDIS_REST_URL` is also accepted. |
| `KV_REST_API_TOKEN` | Vercel: yes for admin saves | Vercel | Injected by the Upstash Redis integration. `UPSTASH_REDIS_REST_TOKEN` is also accepted. |
| `DATA_DIR` | No | cPanel | Folder for CMS JSON files. Default `./data` (relative to the app root). Used only when Redis is not configured and not on Vercel. |
| `TRUST_PROXY_HOPS` | No | cPanel, other hosts | Number of trusted reverse proxies in front of the app, used to pick the client IP for rate limiting from `X-Forwarded-For` (Nth entry from the right). Default `1` (the rightmost entry, i.e. what the one proxy appended). `0` ignores `X-Forwarded-For` and uses `X-Real-IP`. Ignored on Vercel, which uses `x-real-ip`. **On cPanel, confirm what Apache/Passenger actually sends** (e.g. `curl -s -H 'X-Forwarded-For: 6.6.6.6' https://<domain>/api/...` and check which header carries the real address); if the proxy adds no `X-Forwarded-For`, every visitor shares one rate-limit bucket. |

## 2. Vercel

1. Import the repository in Vercel. Framework preset: **Next.js**.
2. In **Marketplace**, add **Upstash Redis** to the project. It injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. In **Project Settings -> Environment Variables**, set `SITE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   and the SMTP / OpenAI variables you need.
4. Deploy. Content is the bundled seed (`content/*.json`) until the first admin save, which writes to Redis.

Without Redis the site works read-only (it serves the bundled seed) and admin saves return 503.

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
4. Add the environment variables from section 1 in the app's UI (or put an `.env` file in the app root).
5. Make sure `data/` is writable: `chmod 755 ~/rahultanwar-app/data`.
6. Click **Restart**.

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

- **Rate limiting:** on cPanel, in-memory rate limiting is per-process and resets on restart. Vercel uses
  Redis-backed limits.
- **CORS:** same-origin only. There is no `CORS_ORIGIN` setting.
- **Concurrent admin saves:** a save is a whole-document read-modify-write with no locking, so two simultaneous
  admin saves can drop one of the edits. This is the same as the old Express server and is acceptable for a
  single-admin CMS.
- **cPanel data is the only copy:** on cPanel `data/*.json` is the only copy of CMS edits (the bundled seed is
  just the starting point). Back it up regularly and never overwrite it on redeploy.
