import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import gsap from "gsap";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { EditorialVisual, toEditorialVenture } from "@/components/site/EditorialVisual";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { SectionCaption } from "@/components/home/SectionCaption";
import { Shell } from "@/components/site/Shell";
import { VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { useMediaQuery, useReducedMotionPreference } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* EditorialVisual (shared with the venture pages) sizes itself for a card; inside the
   accordion it fills the responsive frame instead. */
const VENTURE_ART_FILL =
  "[&_.rt-venture-art]:size-full [&_.rt-venture-art]:min-h-0 [&_.rt-venture-art_img]:size-full [&_.rt-venture-art_img]:object-cover [&_.rt-venture-art_img]:backface-hidden";

const VENTURE_ORDER = ["sr18", "delhi6", "volt50000", "masai", "adatto", "arnika"];
const AUTOPLAY_SECONDS = 4.5;
const MORPH_SECONDS = 0.62;
const HOVER_HIGHLIGHT_TRANSITION = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.7,
};

// cubic-bezier(.65,0,.35,1) as a GSAP ease, without pulling in CustomEase.
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 24; i += 1) {
      const value = sampleX(t);
      if (Math.abs(value - x) < 1e-5) break;
      if (value < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}
const travelEase = cubicBezier(0.65, 0, 0.35, 1);

type Parts = {
  items: HTMLElement[];
  buttons: HTMLElement[];
  panels: HTMLElement[];
  fades: HTMLElement[][];
  ctas: HTMLElement[];
  labels: HTMLElement[];
  bars: HTMLElement[];
  layers: HTMLElement[];
};

export function Ecosystem({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery("(min-width: 851px)");
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");
  const ecosystem = content.sections.ecosystem as
    | { eyebrow?: string; heading?: string; description?: string; ventures?: typeof VENTURES }
    | undefined;
  const ventures = useMemo(
    () =>
      VENTURE_ORDER.map(
        (id) =>
          (ecosystem?.ventures || VENTURES).find((venture) => venture.id === id) ||
          VENTURES.find((venture) => venture.id === id)!,
      )
        .filter(Boolean)
        .map(toEditorialVenture),
    [ecosystem?.ventures],
  );
  const headingLines = (ecosystem?.heading || "Six Ventures. One Operating Philosophy.")
    .split("|")
    .map((line) => line.trim());
  const count = ventures.length;

  const [active, setActive] = useState(0);
  const [userTookControl, setUserTookControl] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const accRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLAnchorElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const rows = useRef<{ v: number }[]>([]);
  const shown = useRef(active);
  const previousShown = useRef(active);
  const activeRef = useRef(active);
  activeRef.current = active;
  const progress = useRef<gsap.core.Tween | null>(null);
  const pauses = useRef(new Set<string>());
  const firstCycle = useRef(true);

  const parts = useCallback((): Parts | null => {
    const root = accRef.current;
    if (!root) return null;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-acc-item]"));
    const one = (sel: string) => items.map((item) => item.querySelector<HTMLElement>(sel)!);
    return {
      items,
      buttons: one("[data-acc-button]"),
      panels: one("[data-acc-panel]"),
      fades: items.map((item) => Array.from(item.querySelectorAll<HTMLElement>("[data-acc-fade]"))),
      ctas: one("[data-acc-cta]"),
      labels: one("[data-acc-cta-label]"),
      bars: one("[data-acc-progress]"),
      layers: Array.from(mediaRef.current?.querySelectorAll<HTMLElement>("[data-acc-layer]") || []),
    };
  }, []);

  const rowState = (index: number) =>
    (rows.current[index] ||= { v: index === shown.current ? 1 : 0 });
  const paintRows = (p: Parts, index: number) => {
    p.panels[index].style.gridTemplateRows = `${rowState(index).v}fr`;
  };
  const tweenRows = (
    tl: gsap.core.Timeline,
    p: Parts,
    index: number,
    to: number,
    vars: gsap.TweenVars,
    position: number,
  ) => {
    tl.to(rowState(index), { ...vars, v: to, onUpdate: () => paintRows(p, index) }, position);
  };
  // Put everything in its resting state for `index` (mount, mode change, reduced motion).
  const snap = useCallback(
    (index: number) => {
      const p = parts();
      if (!p) return;
      timeline.current?.kill();
      timeline.current = null;
      p.items.forEach((_, i) => {
        const open = i === index;
        rowState(i).v = open ? 1 : 0;
        paintRows(p, i);
        gsap.set(p.fades[i], { autoAlpha: open ? 1 : 0, y: 0 });
        gsap.set(p.ctas[i], { autoAlpha: open ? 1 : 0, scaleY: 1 });
        gsap.set(p.labels[i], { autoAlpha: open ? 1 : 0 });
      });
      p.layers.forEach((layer, i) => gsap.set(layer, { autoAlpha: i === index ? 1 : 0, scale: 1 }));
      if (desktop && mediaRef.current)
        gsap.set(mediaRef.current, { borderRadius: 14, scaleX: 1, scaleY: 1, y: 0 });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [desktop, parts],
  );

  // Squeeze and crossfade in place; the media stays anchored to the right column.
  const morph = useCallback(
    (to: number) => {
      const p = parts();
      const media = mediaRef.current;
      if (!p || !media) return;
      timeline.current?.kill();
      const others = p.items.map((_, i) => i).filter((i) => i !== to);
      const alpha = (el: Element) => Number(gsap.getProperty(el, "opacity"));
      const tl = gsap.timeline({ onComplete: () => void (timeline.current = null) });
      timeline.current = tl;

      // Phase 1 — squeeze (0–180ms).
      tl.to(
        media,
        { borderRadius: 999, scaleX: 0.94, scaleY: 0.86, duration: 0.18, ease: "power2.in" },
        0,
      );
      tl.to(
        others.map((i) => p.labels[i]),
        { autoAlpha: 0, duration: 0.08, ease: "power2.in" },
        0,
      );
      tl.to(
        others.map((i) => p.ctas[i]),
        { scaleY: 0.05, duration: 0.12, ease: "power2.in" },
        0,
      );
      tl.to(
        others.map((i) => p.ctas[i]),
        { autoAlpha: 0, duration: 0.06, ease: "none" },
        0.12,
      );
      tl.to(
        others.flatMap((i) => p.fades[i]),
        { autoAlpha: 0, duration: 0.16, ease: "power2.in" },
        0,
      );

      // Phase 2 — crossfade (120–420ms).
      others.forEach((i) => tweenRows(tl, p, i, 0, { duration: 0.3, ease: travelEase }, 0.12));
      p.layers.forEach((layer, i) => {
        if (i !== to) tl.to(layer, { autoAlpha: 0, duration: 0.3, ease: travelEase }, 0.12);
      });
      const incoming = p.layers[to];
      if (incoming) {
        if (alpha(incoming) < 0.5) gsap.set(incoming, { scale: 1.08 });
        tl.to(incoming, { autoAlpha: 1, scale: 1, duration: 0.3, ease: travelEase }, 0.12);
      }

      // Phase 3 — open (380–620ms).
      tl.to(
        media,
        { borderRadius: 14, scaleX: 1, scaleY: 1, duration: 0.24, ease: "expo.out" },
        0.38,
      );
      tweenRows(tl, p, to, 1, { duration: 0.24, ease: "expo.out" }, 0.38);
      const fades = p.fades[to];
      if (fades.some((el) => alpha(el) < 0.5)) gsap.set(fades, { autoAlpha: 0, y: 6 });
      tl.to(fades, { autoAlpha: 1, y: 0, duration: 0.22, ease: "expo.out", stagger: 0.02 }, 0.4);
      const cta = p.ctas[to];
      if (alpha(cta) < 0.5) gsap.set(cta, { autoAlpha: 1, scaleY: 0.05 });
      tl.to(cta, { autoAlpha: 1, scaleY: 1, duration: 0.2, ease: "expo.out" }, 0.4);
      tl.to(p.labels[to], { autoAlpha: 1, duration: 0.12, ease: "none" }, 0.52);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts],
  );

  // Mobile: same accordion, no floating image and no morph.
  const toggleMobile = useCallback(
    (to: number) => {
      const p = parts();
      if (!p) return;
      timeline.current?.kill();
      const tl = gsap.timeline({ onComplete: () => void (timeline.current = null) });
      timeline.current = tl;
      p.items.forEach((_, i) => {
        const open = i === to;
        tweenRows(tl, p, i, open ? 1 : 0, { duration: 0.34, ease: "power2.out" }, 0);
        tl.to(
          [...p.fades[i], p.ctas[i], p.labels[i]],
          { autoAlpha: open ? 1 : 0, duration: 0.24, ease: "power2.out" },
          open ? 0.08 : 0,
        );
        if (open) gsap.set(p.ctas[i], { scaleY: 1 });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts],
  );

  // Reduced motion: panels open instantly, the image swaps with a 150ms opacity crossfade.
  const swapReduced = useCallback(
    (to: number) => {
      const p = parts();
      if (!p) return;
      snap(to);
      p.layers.forEach((layer, i) =>
        gsap.set(layer, { autoAlpha: i === previousShown.current ? 1 : 0 }),
      );
      p.layers.forEach((layer, i) =>
        gsap.to(layer, {
          autoAlpha: i === to ? 1 : 0,
          duration: 0.15,
          ease: "none",
          overwrite: true,
        }),
      );
    },

    [parts, snap],
  );

  // Resting state on mount and whenever the mode (desktop / reduced) changes.
  useLayoutEffect(() => {
    shown.current = activeRef.current;
    snap(activeRef.current);
    return () => {
      timeline.current?.kill();
    };
  }, [snap, reduced, count]);

  // The open row changed.
  useLayoutEffect(() => {
    const from = shown.current;
    if (from === active) return;
    previousShown.current = from;
    shown.current = active;
    if (!desktop) toggleMobile(active);
    else if (reduced) swapReduced(active);
    else morph(active);
  }, [active, desktop, reduced, morph, toggleMobile, swapReduced]);

  // Autoplay: holds while you read. Off on touch, with reduced motion, and once the user takes over.
  const autoplay = desktop && finePointer && !reduced && !userTookControl;
  const syncPause = useCallback(() => {
    const tween = progress.current;
    if (!tween) return;
    if (pauses.current.size) tween.pause();
    else tween.resume();
  }, []);
  const setPause = useCallback(
    (reason: string, on: boolean) => {
      if (on) pauses.current.add(reason);
      else pauses.current.delete(reason);
      syncPause();
    },
    [syncPause],
  );

  useEffect(() => {
    const p = parts();
    progress.current?.kill();
    progress.current = null;
    if (!p) return;
    gsap.set(p.bars, { scaleX: 0 });
    if (!autoplay) return;
    const tween = gsap.to(p.bars[active], {
      scaleX: 1,
      duration: AUTOPLAY_SECONDS,
      delay: firstCycle.current ? 0 : MORPH_SECONDS,
      ease: "none",
      onComplete: () => setActive((index) => (index + 1) % count),
    });
    firstCycle.current = false;
    progress.current = tween;
    syncPause();
    return () => void tween.kill();
  }, [active, autoplay, count, parts, syncPause]);

  // Pause while the accordion is mostly off-screen.
  useEffect(() => {
    const target = accRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setPause("offscreen", !(entry.isIntersecting && entry.intersectionRatio >= 0.35)),
      { threshold: [0, 0.35, 1] },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [setPause]);

  const choose = (index: number) => {
    setUserTookControl(true);
    setActive(index);
  };

  const onRowKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const p = parts();
    if (!p) return;
    const focus = (i: number) => {
      event.preventDefault();
      p.buttons[(i + count) % count]?.focus();
    };
    if (event.key === "ArrowDown") focus(index + 1);
    else if (event.key === "ArrowUp") focus(index - 1);
    else if (event.key === "Home") focus(0);
    else if (event.key === "End") focus(count - 1);
  };

  const current = ventures[active] || ventures[0];
  const hrefOf = (venture: (typeof ventures)[number]) =>
    venture.href || `/ventures/${venture.slug}`;

  return (
    <section
      ref={sectionRef}
      id="ventures"
      className="relative z-2 bg-page py-[var(--rt-section-space)]"
      data-home-tone="light"
      aria-labelledby="rt-ventures-title"
      onPointerEnter={(event) => event.pointerType === "mouse" && setPause("hover", true)}
      onPointerLeave={() => setPause("hover", false)}
      onFocus={() => setPause("focus", true)}
      onBlur={(event) => {
        if (!sectionRef.current?.contains(event.relatedTarget as Node | null))
          setPause("focus", false);
      }}
    >
      <Shell className="pt-[clamp(20px,3vw,42px)]">
        

        <div className="mt-[clamp(37px,3.85vw,61px)] block grid-cols-[minmax(0,1fr)_250px] gap-[clamp(35px,5vw,90px)] [align-items:end] desk:grid min-[1101px]:grid-cols-[minmax(0,1fr)_minmax(250px,0.33fr)]">
          <h2
            className="min-w-0 max-w-[900px] text-[clamp(34px,8vw,48px)] leading-[1.1] font-[440] tracking-[-0.015em] text-balance min-[621px]:text-[clamp(38px,7vw,56px)] desk:text-[clamp(40px,4.5vw,64px)]"
            id="rt-ventures-title"
          >
            {headingLines.map((line, index) => (
              <SplitText
                key={line}
                text={line}
                className={cn(index > 0 && "text-muted")}
                splitType="lines, words"
                mask="lines"
                from={{ yPercent: 105 }}
                to={{ yPercent: 0 }}
                stagger={0.07}
                duration={1.25}
                delay={index * 0.14}
                start="top 86%"
              />
            ))}
          </h2>
          <p
            className="min-w-0 mb-3 max-w-[340px] text-[15px] [align-self:end] leading-[1.7] tracking-[0px] text-body will-change-[transform,opacity] motion-reduce:will-change-auto"
            data-soft-reveal
          >
            {ecosystem?.description ||
              "A portfolio spanning gaming, brewing, consumer beverages, apparel and textiles. Each business has its own market and purpose."}
          </p>
        </div>
      </Shell>

      <Shell
        className="mt-[clamp(39px,4.35vw,66px)] grid grid-cols-[minmax(0,1fr)] justify-between desk:grid-cols-[minmax(0,40%)_minmax(0,min(58%,820px))]"
        ref={accRef}
      >
        <div className="flex min-w-0 flex-col gap-1">
          {ventures.map((venture, index) => {
            const open = index === active;
            const buttonId = `rt-acc-${venture.id}-button`;
            const panelId = `rt-acc-${venture.id}-panel`;
            return (
              <div
                className="group/item relative overflow-hidden rounded-[14px] bg-transparent [transition:background-color_0.24s_ease] data-open:bg-surface data-open:[transition-delay:0.38s] motion-reduce:[transition:none]"
                key={venture.id}
                data-acc-item={index}
                data-open={open ? "" : undefined}
              >
                <h3 className="m-0 [font:inherit]">
                  <button
                    type="button"
                    className="group/trigger flex min-h-12 w-full cursor-pointer items-center gap-3.5 border-0 border-none border-current bg-transparent px-4 py-3.5 text-left text-inherit [font:inherit] focus-visible:rounded-[14px] focus-visible:outline-2 focus-visible:-outline-offset-3 focus-visible:outline-accent desk:gap-4 desk:px-6 desk:py-5"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    data-acc-button
                    onClick={() => choose(index)}
                    onKeyDown={(event) => onRowKey(event, index)}
                  >
                    <span
                      className="grid size-[30px] flex-none place-items-center rounded-[50%] text-[12px] font-medium text-muted tabular-nums [box-shadow:inset_0_0_0_1px_var(--color-hairline)] [transition:background-color_0.18s_ease,color_0.18s_ease,box-shadow_0.18s_ease] group-data-open/item:bg-ink group-data-open/item:text-page group-data-open/item:[box-shadow:inset_0_0_0_1px_var(--color-ink)] group-data-open/item:[transition-delay:0.38s] motion-reduce:[transition:none]"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 flex-[1_1_auto] flex-col items-start gap-[3px] desk:flex-row desk:items-baseline desk:gap-4">
                      <span className="text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-body [transition:color_0.3s_ease] group-hover/trigger:text-ink group-data-open/item:text-ink motion-reduce:[transition:none] desk:text-[22px]">
                        {venture.name}
                      </span>
                      <span className="ml-0 text-[12px] whitespace-normal text-muted desk:ml-auto desk:whitespace-nowrap">
                        {venture.industry} · {venture.country}
                      </span>
                    </span>
                    <ChevronDown
                      className="flex-none text-muted [transition:transform_0.3s_var(--ease-expo)] group-data-open/item:[transform:rotate(180deg)] motion-reduce:[transition:none]"
                      size={18}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  className="grid [grid-template-rows:0fr] group-data-open/item:[grid-template-rows:1fr]"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  inert={!open}
                  data-acc-panel
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex flex-col items-start px-4 pt-[2px] pb-5 desk:pt-0 desk:pr-6 desk:pb-6 desk:pl-[70px]">
                      <div
                        className={cn(
                          "hidden max-desk:mb-[18px] max-desk:block max-desk:aspect-[16/10] max-desk:w-full max-desk:overflow-hidden max-desk:rounded-[12px] max-desk:bg-hairline",
                          VENTURE_ART_FILL,
                        )}
                        aria-hidden="true"
                        data-acc-fade
                      >
                        <EditorialVisual venture={venture} content={content} />
                      </div>
                      <p
                        className="m-0 text-[17px] leading-[1.45] font-[450] tracking-[-0.01em] text-ink"
                        data-acc-fade
                      >
                        {venture.phrase}
                      </p>
                      <p
                        className="mt-2 mb-0 max-w-[42ch] text-[15px] leading-[1.65] text-body"
                        data-acc-fade
                      >
                        {venture.editorialSummary || venture.short}
                      </p>
                      <p className="mt-0 pt-3.5 text-[12px] text-muted desk:mt-auto" data-acc-fade>
                        Est. {venture.year} · {venture.country}
                      </p>
                      <a
                        className="group/cta mt-3.5 inline-flex origin-center rounded-[999px] bg-ink px-4 py-[9px] text-[13px] leading-[1.3] font-medium text-page [transition:background-color_0.25s_ease] hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-accent motion-reduce:[transition:none]"
                        href={hrefOf(venture)}
                        data-transition-label={venture.name}
                        data-acc-cta
                      >
                        <span className="inline-flex items-center gap-2" data-acc-cta-label>
                          Explore {venture.name}
                          <ArrowRight
                            className="[transition:transform_0.25s_var(--ease-expo)] group-hover/cta:[transform:translateX(3px)] motion-reduce:[transition:none]"
                            size={14}
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
                <span
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-accent [transform:scaleX(0)]"
                  aria-hidden="true"
                  data-acc-progress
                />
              </div>
            );
          })}
        </div>

        <div className="relative hidden min-w-0 aspect-[4/3] overflow-hidden desk:block">
          <a
            ref={mediaRef}
            className="absolute inset-0 block overflow-hidden rounded-[14px] bg-surface will-change-[transform,border-radius]"
            href={hrefOf(current)}
            data-transition-label={current.name}
            tabIndex={-1}
            aria-hidden="true"
          >
            {ventures.map((venture, index) => (
              <div
                key={venture.id}
                className={cn(
                  "invisible absolute inset-0 opacity-0 will-change-[opacity,transform] data-current:visible data-current:opacity-100",
                  VENTURE_ART_FILL,
                )}
                data-acc-layer={index}
                data-current={index === active ? "" : undefined}
              >
                <EditorialVisual venture={venture} content={content} priority />
              </div>
            ))}
          </a>
        </div>
      </Shell>

      <Shell
        className="mt-[clamp(37px,3.85vw,61px)] flex flex-col justify-between gap-6 text-[13px] leading-[1.6] text-body will-change-[transform,opacity] [align-items:start] min-[621px]:flex-row min-[621px]:items-center min-[621px]:gap-9 motion-reduce:will-change-auto"
        data-soft-reveal
      >
        <span>Explore the people, products and industries behind each venture.</span>
        <a
          className="group/link inline-flex w-fit flex-none items-center justify-between gap-10 self-start pt-[11px] pb-[10px] text-[13px] leading-[1.4] font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-accent min-[621px]:self-auto"
          href="#presence"
        >
          Across borders{" "}
          <ArrowUpRight
            className="[transition:transform_0.6s_cubic-bezier(0.19,1,0.22,1)] group-hover/link:[transform:translate(4px,-4px)] group-focus-visible/link:[transform:translate(4px,-4px)] motion-reduce:[transition:none]"
            size={16}
            strokeWidth={1.4}
          />
        </a>
      </Shell>
    </section>
  );
}
