#!/usr/bin/env node
/**
 * Dev-only visual regression check for the homepage sections that are being
 * moved to Tailwind. Not a dependency of the site: Playwright is pulled in by npx.
 *
 *   npx -y -p playwright node scripts/visual-check.mjs capture before
 *   npx -y -p playwright node scripts/visual-check.mjs capture after
 *   npx -y -p playwright node scripts/visual-check.mjs diff before after
 *
 * capture: for 1440×900, 1024×768 and 390×844, with and without reduced motion,
 *   waits for the greeting preloader, scrolls each in-scope section into view,
 *   waits 2.5s for its reveals and screenshots it. Infinite animations (the hero
 *   marquee) are frozen at frame 0 and the accordion's autoplay progress line is
 *   hidden so runs are comparable. Also records the computed styles of every
 *   element in those sections (styles-*.json).
 * diff: compares the two runs pixel by pixel (≤1px anti-aliasing tolerance) and
 *   element by element (computed styles), and writes diff images.
 *
 * Env: VISUAL_BASE (default http://localhost:3000), VISUAL_DIR (default /tmp/visual),
 *      VISUAL_ONLY (comma-separated section/page names, for quick iterations).
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BASE = process.env.VISUAL_BASE || "http://localhost:3000";
const ROOT = process.env.VISUAL_DIR || "/tmp/visual";
const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "1024", width: 1024, height: 768, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
// In-scope sections: [name, selector]. Tall sections get one shot per viewport height.
const SECTIONS = [
  ["hero", "#top"],
  ["ventures", "#ventures"],
  ["about", "#about"],
  ["philosophy", "#philosophy"],
  ["contact", "#contact"],
];
// Out-of-scope neighbours, captured too so a shared-CSS change can't slip past unnoticed.
const NEIGHBOURS = [
  ["introduction", "#introduction"],
  ["presence", "#presence"],
  ["milestones", "#milestones"],
  ["footer", "footer"],
];
// Other pages that share the header.
const PAGES = [
  ["venture", "/ventures/sr18-gaming"],
  ["privacy", "/privacy"],
];
// Time-dependent elements, hidden before each shot and left out of the style snapshot.
const VOLATILE = "[data-acc-progress]";
const REVEAL_WAIT = 2500;
const ONLY = (process.env.VISUAL_ONLY || "").split(",").filter(Boolean);
const wanted = ([name]) => !ONLY.length || ONLY.includes(name);

async function loadPlaywright() {
  const pick = (mod) => (mod.chromium ? mod : mod.default);
  try {
    return pick(await import("playwright"));
  } catch {
    /* fall through: npx puts its node_modules/.bin on PATH */
  }
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    if (!/node_modules[\\/]\.bin$/.test(dir)) continue;
    try {
      const require = createRequire(path.join(dir, "..", "noop.js"));
      return pick(await import(pathToFileURL(require.resolve("playwright")).href));
    } catch {
      /* try the next entry */
    }
  }
  throw new Error(
    "Playwright not found. Run: npx -y -p playwright node scripts/visual-check.mjs …",
  );
}

async function launch(chromium) {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return chromium.launch();
  }
}

/* Runs in the page: computed styles of every element inside a section (and the header/drawer). */
function collectStyles([selectors, volatile]) {
  const PROPS = [
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "z-index",
    "box-sizing",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "line-height",
    "letter-spacing",
    "font-variation-settings",
    "font-variant-numeric",
    "text-align",
    "text-transform",
    "white-space",
    "text-wrap",
    "color",
    "background-color",
    "background-image",
    "background-size",
    "border-top-width",
    "border-right-width",
    "border-bottom-width",
    "border-left-width",
    "border-top-style",
    "border-top-color",
    "border-bottom-color",
    "border-left-color",
    "border-radius",
    "outline-style",
    "outline-offset",
    "opacity",
    "visibility",
    "transform",
    "transform-origin",
    "translate",
    "scale",
    "rotate",
    "clip-path",
    "mask-image",
    "overflow-x",
    "overflow-y",
    "grid-template-columns",
    "grid-template-rows",
    "grid-column-start",
    "grid-column-end",
    "column-gap",
    "row-gap",
    "flex-direction",
    "flex-wrap",
    "flex-grow",
    "flex-shrink",
    "flex-basis",
    "align-items",
    "align-self",
    "justify-content",
    "aspect-ratio",
    "object-fit",
    "object-position",
    "min-width",
    "max-width",
    "min-height",
    "max-height",
    "list-style-type",
    "cursor",
    "pointer-events",
    "will-change",
    "filter",
    "backdrop-filter",
    "box-shadow",
    "isolation",
    "transition-property",
    "transition-duration",
    "transition-timing-function",
    "transition-delay",
    "animation-duration",
    "animation-timing-function",
    "animation-delay",
    "animation-iteration-count",
    "animation-fill-mode",
    "animation-play-state",
    "animation-direction",
    "content",
    "text-decoration-line",
    "-webkit-text-stroke-width",
    "backface-visibility",
    "inset",
  ];
  const PSEUDO = [
    "content",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "width",
    "height",
    "background-color",
    "transform",
    "transform-origin",
    "transition-property",
    "transition-duration",
    "transition-timing-function",
    "scale",
    "translate",
  ];
  const out = {};
  const keyOf = (el, root, rootKey) => {
    const parts = [];
    for (let node = el; node && node !== root; node = node.parentElement) {
      const index = Array.prototype.indexOf.call(node.parentElement.children, node);
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    }
    return [rootKey, ...parts].join(">");
  };
  for (const [rootKey, selector] of selectors) {
    const root = document.querySelector(selector);
    if (!root) continue;
    for (const el of [root, ...root.querySelectorAll("*")]) {
      if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
      if (el.matches(volatile)) continue;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const record = {
        cls: String(el.getAttribute("class") || ""),
        rect: [rect.left, rect.top + scrollY, rect.width, rect.height].map(
          (v) => Math.round(v * 10) / 10,
        ),
      };
      for (const prop of PROPS) record[prop] = cs.getPropertyValue(prop);
      for (const pseudo of ["::before", "::after"]) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content && ps.content !== "none" && ps.content !== "normal") {
          record[pseudo] = Object.fromEntries(PSEUDO.map((p) => [p, ps.getPropertyValue(p)]));
        }
      }
      out[el === root ? rootKey : keyOf(el, root, rootKey)] = record;
    }
  }
  return out;
}

async function settle(page) {
  // Freeze infinite CSS animations (the hero marquee) at their first frame; hide time-dependent bits.
  await page.evaluate((volatile) => {
    document
      .querySelectorAll(volatile)
      .forEach((el) => el.style.setProperty("visibility", "hidden"));
    for (const animation of document.getAnimations()) {
      const timing = animation.effect?.getTiming?.();
      if (timing && timing.iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      }
    }
  }, VOLATILE);
  await page.waitForTimeout(150);
}

// For screenshots only: also pin infinite animations with a temporary !important rule, so a
// CSS play-state change during the shot (e.g. an IntersectionObserver callback) can't resume them.
async function freeze(page) {
  await settle(page);
  await page.evaluate(() => {
    if (!document.getElementById("visual-freeze")) {
      const style = document.createElement("style");
      style.id = "visual-freeze";
      style.textContent = "[data-visual-frozen]{animation-play-state:paused!important}";
      document.head.appendChild(style);
    }
    for (const animation of document.getAnimations()) {
      if (animation.effect?.getTiming?.().iterations === Infinity)
        animation.effect.target?.setAttribute("data-visual-frozen", "");
    }
  });
  await page.waitForTimeout(100);
}
async function thaw(page) {
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-visual-frozen]")
      .forEach((el) => el.removeAttribute("data-visual-frozen"));
  });
}

async function scrollStepped(page, targetY) {
  await page.evaluate(async (y) => {
    const target = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    for (let s = scrollY; Math.abs(target - s) > 1; ) {
      s += Math.sign(target - s) * Math.min(200, Math.abs(target - s));
      window.scrollTo(0, s);
      await new Promise((r) => setTimeout(r, 50));
    }
  }, targetY);
}

async function capture(label) {
  const { chromium } = await loadPlaywright();
  const dir = path.join(ROOT, label);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const browser = await launch(chromium);
  for (const reduced of [false, true]) {
    for (const viewport of VIEWPORTS) {
      const tag = `${viewport.name}${reduced ? "-reduced" : ""}`;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.goto(BASE + "/?intro=1", { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // Wait for the greeting preloader to hand over (or to be skipped under reduced motion).
      await page.waitForFunction(
        () => {
          const pre = document.querySelector(".rt-preloader");
          const gone = !pre || getComputedStyle(pre).display === "none";
          return gone && document.querySelector("#top")?.getAttribute("data-intro") === "done";
        },
        null,
        { timeout: 20000 },
      );
      await page.mouse.move(1, 1);
      await page.waitForTimeout(REVEAL_WAIT);
      for (const [name, selector] of [...SECTIONS, ...NEIGHBOURS].filter(wanted)) {
        const box = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          const r = el.getBoundingClientRect();
          return { top: r.top + scrollY, height: r.height };
        }, selector);
        const shots = Math.min(4, Math.max(1, Math.ceil(box.height / viewport.height)));
        for (let i = 0; i < shots; i++) {
          await scrollStepped(page, box.top + i * viewport.height);
          await page.waitForTimeout(REVEAL_WAIT);
          await freeze(page);
          await page.screenshot({ path: path.join(dir, `${tag}-${name}-${i}.png`) });
          await thaw(page);
        }
      }
      // Computed styles, taken with every reveal finished (bottom of the last section).
      await settle(page);
      const styles = await page.evaluate(collectStyles, [
        [
          ...SECTIONS,
          ...NEIGHBOURS,
          ["header", "[data-site-header], .rt-site-header"],
          ["drawer", "#rt-menu-panel"],
        ],
        VOLATILE,
      ]);
      writeFileSync(path.join(dir, `styles-${tag}.json`), JSON.stringify(styles));
      // Mobile drawer, opened from the hero.
      if (viewport.mobile && wanted(["drawer"])) {
        await scrollStepped(page, 0);
        await page.waitForTimeout(800);
        await page.locator("#top [data-menu-trigger]").click();
        await page.waitForTimeout(1400);
        await freeze(page);
        await page.screenshot({ path: path.join(dir, `${tag}-drawer-0.png`) });
        await thaw(page);
        const drawer = await page.evaluate(collectStyles, [
          [["drawer-open", "#rt-menu-panel"]],
          VOLATILE,
        ]);
        writeFileSync(path.join(dir, `styles-${tag}-drawer.json`), JSON.stringify(drawer));
      }
      // Inner pages: header + top of page, scrolled and unscrolled.
      for (const [name, url] of PAGES.filter(wanted)) {
        await page.goto(BASE + url, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(REVEAL_WAIT);
        await freeze(page);
        await page.screenshot({ path: path.join(dir, `${tag}-${name}-0.png`) });
        await thaw(page);
        await scrollStepped(page, 600);
        await page.waitForTimeout(1200);
        await freeze(page);
        await page.screenshot({ path: path.join(dir, `${tag}-${name}-1.png`) });
        await thaw(page);
        const inner = await page.evaluate(collectStyles, [
          [[`${name}-header`, "[data-site-header], .rt-site-header"]],
          VOLATILE,
        ]);
        writeFileSync(path.join(dir, `styles-${tag}-${name}.json`), JSON.stringify(inner));
      }
      await context.close();
      console.log(`captured ${tag}`);
    }
  }
  await browser.close();
}

async function diff(before, after) {
  const { chromium } = await loadPlaywright();
  const a = path.join(ROOT, before);
  const b = path.join(ROOT, after);
  const out = path.join(ROOT, `diff-${before}-${after}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const browser = await launch(chromium);
  const page = await browser.newPage();
  let failures = 0;

  // Pixels: a pixel counts as different if any channel differs by more than 24 and no
  // neighbour within 1px matches it (anti-aliasing tolerance).
  for (const file of readdirSync(a)
    .filter((f) => f.endsWith(".png"))
    .sort()) {
    if (ONLY.length && !ONLY.some((name) => file.includes(`-${name}-`))) continue;
    if (!existsSync(path.join(b, file))) {
      console.log(`MISSING  ${file}`);
      failures++;
      continue;
    }
    const toData = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");
    const result = await page.evaluate(
      async ([srcA, srcB]) => {
        const load = (src) =>
          new Promise((res) => {
            const img = new Image();
            img.onload = () => res(img);
            img.src = src;
          });
        const [ia, ib] = await Promise.all([load(srcA), load(srcB)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: true };
        const w = ia.width,
          h = ia.height;
        const read = (img) => {
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const x = c.getContext("2d");
          x.drawImage(img, 0, 0);
          return x.getImageData(0, 0, w, h).data;
        };
        const da = read(ia),
          db = read(ib);
        const near = (i, j) =>
          Math.abs(da[i] - db[j]) <= 24 &&
          Math.abs(da[i + 1] - db[j + 1]) <= 24 &&
          Math.abs(da[i + 2] - db[j + 2]) <= 24;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(ia, 0, 0);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillRect(0, 0, w, h);
        // A differing pixel "on an edge" (high local contrast in the baseline) is anti-aliasing noise
        // from a sub-pixel shift; anything else is a real change.
        const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        const onEdge = (x, y) => {
          let lo = 255,
            hi = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx,
                yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
              const v = lum(da, (yy * w + xx) * 4);
              lo = Math.min(lo, v);
              hi = Math.max(hi, v);
            }
          return hi - lo > 60;
        };
        let count = 0,
          solid = 0;
        const marks = [];
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (near(i, i)) continue;
            let ok = false;
            for (let dy = -1; dy <= 1 && !ok; dy++)
              for (let dx = -1; dx <= 1 && !ok; dx++) {
                const xx = x + dx,
                  yy = y + dy;
                if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
                if (near(i, (yy * w + xx) * 4)) ok = true;
              }
            if (!ok) {
              count++;
              if (!onEdge(x, y)) solid++;
              if (marks.length < 200000) marks.push(x, y);
            }
          }
        ctx.fillStyle = "rgb(255,0,0)";
        for (let k = 0; k < marks.length; k += 2) ctx.fillRect(marks[k], marks[k + 1], 1, 1);
        return { count, solid, png: count ? canvas.toDataURL("image/png") : null };
      },
      [toData(path.join(a, file)), toData(path.join(b, file))],
    );
    if (result.sizeMismatch) {
      console.log(`SIZE     ${file}`);
      failures++;
    } else if (result.count && !result.solid) {
      writeFileSync(path.join(out, file), Buffer.from(result.png.split(",")[1], "base64"));
      console.log(`aa-only  ${file}  ${result.count} px, all on edges (≤1px anti-aliasing)`);
    } else if (result.count) {
      writeFileSync(path.join(out, file), Buffer.from(result.png.split(",")[1], "base64"));
      console.log(`DIFF     ${file}  ${result.count} px (${result.solid} off-edge)`);
      failures++;
    } else console.log(`same     ${file}`);
  }

  // Computed styles, element by element.
  for (const file of readdirSync(a)
    .filter((f) => f.startsWith("styles-"))
    .sort()) {
    if (!existsSync(path.join(b, file))) continue;
    const sa = JSON.parse(readFileSync(path.join(a, file), "utf8"));
    const sb = JSON.parse(readFileSync(path.join(b, file), "utf8"));
    const lines = [];
    // Positions are compared relative to their section, so a height change upstream
    // shows up once (on the element that changed), not on everything below it.
    const relative = (data, key) => {
      const rect = data[key]?.rect;
      const root = data[key.split(">")[0]]?.rect;
      if (!rect) return rect;
      if (!key.includes(">")) return [rect[2], rect[3]]; // section roots: size only
      return [rect[0] - root[0], rect[1] - root[1], rect[2], rect[3]].map(
        (v) => Math.round(v * 10) / 10,
      );
    };
    // Time-driven elements in neighbouring sections (scroll-velocity marquee, live clocks).
    const volatile = Object.keys(sa).filter((key) =>
      /rb-velocity|rt-clock|aui-sliding/.test(sa[key].cls || ""),
    );
    for (const key of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
      if (volatile.some((v) => key === v || key.startsWith(v + ">"))) continue;
      if (!sa[key] || !sb[key]) {
        lines.push(`${sa[key] ? "-" : "+"} ${key}`);
        continue;
      }
      for (const prop of new Set([...Object.keys(sa[key]), ...Object.keys(sb[key])])) {
        if (prop === "cls") continue; // class names are expected to change
        const va = JSON.stringify(prop === "rect" ? relative(sa, key) : sa[key][prop]);
        const vb = JSON.stringify(prop === "rect" ? relative(sb, key) : sb[key][prop]);
        if (prop === "rect") {
          const ra = relative(sa, key);
          const rb = relative(sb, key);
          if (ra && rb && ra.length === rb.length && ra.every((v, i) => Math.abs(v - rb[i]) <= 0.5))
            continue;
          // Not rendered in either run (display: none): its box is meaningless.
          if (ra && rb && ra.length === 4 && !ra[2] && !ra[3] && !rb[2] && !rb[3]) continue;
        }
        if (va !== vb) lines.push(`  ${key}  ${prop}: ${va} → ${vb}`);
      }
    }
    writeFileSync(path.join(out, file.replace(".json", ".txt")), lines.join("\n"));
    console.log(`${lines.length ? "STYLES" : "same  "}   ${file}  ${lines.length} differences`);
    if (lines.length) failures++;
  }
  await browser.close();
  console.log(failures ? `\n${failures} file(s) differ — see ${out}` : "\nNo differences.");
  process.exitCode = failures ? 1 : 0;
}

const [mode, x, y] = process.argv.slice(2);
if (mode === "capture" && x) await capture(x);
else if (mode === "diff" && x && y) await diff(x, y);
else {
  console.log("Usage: capture <label> | diff <before> <after>");
  process.exitCode = 2;
}
