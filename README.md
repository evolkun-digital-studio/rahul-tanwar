# Rahul Tanwar — founder portfolio · V6 library motion edition

Next.js (App Router) + React 19 + Tailwind CSS v4 portfolio. V6 rebuilds the homepage hero and animates every
story section with components ported from **React Bits**, **Animate UI**, **Inspira UI** and **motion-primitives**,
running on **GSAP**, **Motion (framer-motion)**, **anime.js v4**, **three.js** and **Lenis**. The CMS, admin, contact form,
chat and SEO now run as Next.js route handlers and metadata (no separate Express server). See `DEPLOY.md` to deploy to Vercel or cPanel.

Requires Node `>=20.9`.

```bash
npm install
cp .env.example .env.local   # .env.local is not copied into the standalone/cPanel bundle
npm run dev          # http://localhost:3000  (add /?intro=1 to replay the preloader)
npm test             # server logic tests (Vitest)
npm run typecheck
npm run build && npm start
```

`npm start` prints a Next warning because the app uses `output: "standalone"`; that is expected. For production use
`node .next/standalone/server.js` or the cPanel bundle (`npm run package:cpanel`, see DEPLOY.md).

Deployment (Vercel and cPanel), environment variables and CMS storage are documented in [DEPLOY.md](DEPLOY.md).

## What each section uses

| Section | Library components (file) | Engine |
| --- | --- | --- |
| **Hero** (rebuilt, cleaner) | React Bits **SplitText** — name rises char by char behind a line mask · React Bits **RotatingText** — "Ventures in *gaming / craft beer / …*" one word per venture · React Bits **CircularText** — spinning *Scroll to explore* seal that speeds up with scroll velocity and hover · React Bits **GridDistortion** — portrait flexes under the cursor (three.js, capped so the face never warps) · Inspira UI **Text Generate Effect** — summary resolves word by word · Animate UI **Magnetic** + **Rolling Text** — CTA · motion-primitives **Progressive Blur** — caption edge | GSAP timeline (clip-path wipe, scale, scroll-out), three.js, Motion |
| **On building** | React Bits **ScrollFloat** (headline) · React Bits **BlurText** ("Think long term.") · React Bits **ScrollReveal** (scrubbed opacity + blur + rotation) · Animate UI **Highlight Text** ("do the work that lasts") · motion-primitives **Text Effect** · React Bits **ScrollVelocity** — two-row venture / industry marquee that reacts to scroll speed and direction | GSAP ScrollTrigger, Motion |
| **The Ecosystem — Rahul Tanwar Ventures** | React Bits **SplitText** (heading) · motion-primitives **Text Effect** (summary) · motion-primitives **Animated Background** — highlight glides between rows · Animate UI **Rolling Text** — venture names roll on hover · Animate UI **Sliding Number** — `01 / 06` counter · Animate UI **Cursor** — "View ↗" follower on the image stage · Animate UI **Magnetic** arrows | GSAP directional clip-path wipes with parallax push between ventures |
| **Where it happens** | Inspira UI **World Map** — dotted Gulf → South Asia map, dots ripple out from Dubai, route draws to New Delhi, courier travels it, pins pulse · React Bits **CountUp** (≈2,200 km) · Animate UI **Sliding Number** — live Dubai / New Delhi clocks · React Bits **SplitText** (heading, city names) · **ScrollReveal** (closing line) · Animate UI **Fade** | **anime.js v4** (`stagger`, `svg.createDrawable`, `svg.createMotionPath`, timeline), GSAP image wipes |
| **The Man Behind The Brand** | React Bits **TiltedCard** — spring tilt + cursor caption on the portrait · React Bits **SplitText** · **ScrollReveal** (lead) · motion-primitives **Text Effect** (paragraphs) · Animate UI **Counting Number** — 06 ventures / 05 industries / 02 markets · Animate UI **Rolling Text** link | GSAP clip reveal + depth parallax, Motion |
| **Milestones** | Animate UI **Sliding Number** — giant year physically rolls 2011 → 2023 → 2024 → 2025 → Now in a sticky column · Inspira UI **Tracing Beam** — gold-to-ink beam with a head marker that follows reading · motion-primitives **Text Shimmer** ("Now") · React Bits **SplitText** | Motion springs, GSAP ScrollTrigger |
| **Header** | Animate UI **Rolling Text** on nav hover | Motion |
| **Page transitions** | Barba.js-style leave → navigate → enter curtain with the destination name (home ↔ ventures ↔ privacy) | GSAP |

All ported components live in `src/components/motion-library/{react-bits,animate-ui,inspira-ui,motion-primitives}`;
each file starts with a comment naming the original component, its source path, what was kept and what was changed.
Section components live in `src/components/home/`.

### Notes on the choices

- **Barba.js** swaps server-rendered HTML containers, which would fight React's renderer, so the same
  leave/enter pattern is implemented in `src/lib/pageTransition.ts` with GSAP. The curtain markup sits in `app/layout.tsx` (`PageCurtain`) so it covers the first paint; it resets on back/forward cache restores.
- **Inspira UI** is a Vue library — World Map, Tracing Beam and Text Generate Effect were ported to React.
- **three.js** is code-split: the portrait renders as a normal `<img>` first (LCP/SEO) and the WebGL layer
  loads afterwards on desktop with a mouse only. Touch, reduced motion and no-WebGL keep the photo.
- The corridor map is pre-computed with `dotted-map` (`npm run map:build`), so no world GeoJSON ships.
- One motion grammar: expo-out for reveals, power4 for wipes, shared tokens in `src/lib/motion.ts`.
  The hero waits for the greeting preloader via `markIntroDone()` / `onIntroDone()`.
- Everything respects `prefers-reduced-motion` (static, fully readable content), keeps accessible text
  (split text is `aria-hidden` with a readable label) and pauses loops while off-screen.
- Fix included: the India photograph now sits lower than Dubai as originally intended (a base
  `figure` reset was overriding it).

## Dependencies and licences

New dependencies: `three`, `animejs` (runtime); `@types/three`, `dotted-map` (dev).
Check upstream licences before redistribution: React Bits (MIT + Commons Clause), Animate UI (MIT),
Inspira UI (MIT), motion-primitives (MIT).
