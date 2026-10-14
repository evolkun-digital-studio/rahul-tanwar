import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EditorialVisual, toEditorialVenture } from "@/components/site/EditorialVisual";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import {
  AnimatedBackgroundMark,
  useAnimatedBackgroundGroup,
} from "@/components/motion-library/motion-primitives/AnimatedBackground";
import technologyImage from "@/assets/technology.avif";
import { VENTURES } from "@/lib/data";
import type { CmsImage, PageCmsContent } from "@/lib/cms";
import { useMediaQuery, useReducedMotionPreference } from "@/lib/motion";
import { resolveDisplayedVenture } from "@/lib/venture-interaction";

gsap.registerPlugin(ScrollTrigger);

const technologyPhoto: CmsImage = {
  url: typeof technologyImage === "string" ? technologyImage : technologyImage.src,
  alt: "SR18 Gaming technology and digital entertainment experience.",
  title: "SR18 Gaming technology",
};

const VENTURE_ORDER = ["sr18", "delhi6", "volt50000", "masai", "adatto", "arnika"];
const HOVER_HIGHLIGHT_TRANSITION = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.7,
};

export function Ecosystem({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery("(min-width: 851px)");
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

  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const displayed = resolveDisplayedVenture(active, hovered, desktop);
  const group = useAnimatedBackgroundGroup();
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLAnchorElement>(null);
  const previous = useRef(0);
  const depth = useRef(ventures.length + 2);

  // The row nearest the sticky image's visual center owns the stage.
  useLayoutEffect(() => {
    const list = listRef.current;
    const stage = stageRef.current;
    if (!list || !stage || !desktop) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-venture-row]"));
    const syncActiveRow = () => {
      const stageRect = stage.getBoundingClientRect();
      const readingLine = stageRect.top + stageRect.height / 2;
      let next = 0;
      let nearest = Number.POSITIVE_INFINITY;

      rows.forEach((row, index) => {
        const rect = row.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - readingLine);
        if (distance < nearest) {
          nearest = distance;
          next = index;
        }
      });
      setActive((current) => (current === next ? current : next));
    };

    const trigger = ScrollTrigger.create({
      trigger: list,
      start: "top bottom",
      end: "bottom top",
      invalidateOnRefresh: true,
      onEnter: syncActiveRow,
      onEnterBack: syncActiveRow,
      onUpdate: syncActiveRow,
      onRefresh: syncActiveRow,
    });
    syncActiveRow();
    return () => trigger.kill();
  }, [desktop, ventures.length]);

  // Refresh trigger geometry after local media, fonts, or responsive layout settle.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    const stage = stageRef.current;
    if (!section || !list || !stage) return;

    let frame = 0;
    let alive = true;
    const refresh = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (alive) ScrollTrigger.refresh();
      });
    };
    const pendingImages = Array.from(section.querySelectorAll<HTMLImageElement>("img")).filter(
      (image) => !image.complete,
    );
    pendingImages.forEach((image) => {
      image.addEventListener("load", refresh, { once: true });
      image.addEventListener("error", refresh, { once: true });
    });

    const observer = new ResizeObserver(refresh);
    observer.observe(list);
    observer.observe(stage);
    document.fonts?.ready.then(refresh);
    refresh();

    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      pendingImages.forEach((image) => {
        image.removeEventListener("load", refresh);
        image.removeEventListener("error", refresh);
      });
    };
  }, [ventures.length]);

  // Start decoding every stage image before the first interaction so the
  // hover transition never waits for a large asset to become paint-ready.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const images = Array.from(stage.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((image) => {
      if (typeof image.decode === "function") void image.decode().catch(() => undefined);
    });
  }, [ventures.length]);

  // Initial stage state.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>("[data-stage-panel]"));
    previous.current = 0;
    panels.forEach((panel, index) =>
      gsap.set(panel, {
        autoAlpha: index === 0 ? 1 : 0,
        clipPath: "inset(0% 0% 0% 0%)",
        zIndex: index === 0 ? depth.current : 1,
      }),
    );
    return () => gsap.killTweensOf(panels);
  }, [ventures.length]);

  // Directional clip-path wipe between ventures (GSAP).
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const from = previous.current;
    if (from === displayed) return;
    previous.current = displayed;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>("[data-stage-panel]"));
    const incoming = panels[displayed];
    const outgoing = panels[from];
    if (!incoming) return;
    depth.current += 1;
    const forward = displayed > from;
    const artLayers = panels
      .map((panel) => panel.querySelector<HTMLElement>(".rt-venture-art"))
      .filter((art): art is HTMLElement => Boolean(art));

    gsap.killTweensOf([...panels, ...artLayers]);
    panels.forEach((panel, index) => {
      if (index !== displayed && index !== from) {
        gsap.set(panel, {
          autoAlpha: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          zIndex: 1,
        });
      }
    });

    if (reduced) {
      gsap.set(incoming, { autoAlpha: 1, zIndex: depth.current, clipPath: "inset(0% 0% 0% 0%)" });
      if (outgoing) gsap.set(outgoing, { autoAlpha: 0, zIndex: 1 });
      return;
    }
    const incomingArt = incoming.querySelector<HTMLElement>(".rt-venture-art");
    const outgoingArt = outgoing?.querySelector<HTMLElement>(".rt-venture-art");
    if (outgoing) gsap.set(outgoing, { autoAlpha: 1, zIndex: depth.current - 1 });
    gsap.set(incoming, {
      autoAlpha: 1,
      zIndex: depth.current,
      clipPath: forward ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
    });
    const transition = gsap.timeline({
      onComplete: () => {
        panels.forEach((panel, index) => {
          gsap.set(panel, {
            autoAlpha: index === displayed ? 1 : 0,
            clipPath: "inset(0% 0% 0% 0%)",
            zIndex: index === displayed ? depth.current : 1,
          });
        });
      },
    });
    transition.to(
      incoming,
      { clipPath: "inset(0% 0% 0% 0%)", duration: 0.46, ease: "power3.out" },
      0,
    );
    if (incomingArt)
      transition.fromTo(
        incomingArt,
        { scale: 1.08, yPercent: forward ? 3 : -3 },
        { scale: 1, yPercent: 0, duration: 0.58, ease: "power3.out" },
        0,
      );
    if (outgoingArt)
      transition.fromTo(
        outgoingArt,
        { yPercent: 0, scale: 1 },
        {
          yPercent: forward ? -2 : 2,
          scale: 1.015,
          duration: 0.46,
          ease: "power3.out",
        },
        0,
      );
    return () => {
      transition.kill();
    };
  }, [displayed, reduced]);

  const current = ventures[displayed] || ventures[0];

  return (
    <section
      ref={sectionRef}
      id="ventures"
      className="relative z-[2] bg-white py-[clamp(34px,3.85vw,56px)] text-[var(--rt-ink)]"
      data-home-tone="light"
      aria-labelledby="rt-ventures-title"
    >
      <div className="mx-auto w-full max-w-[1680px] px-[var(--rt-gutter)] pt-[clamp(20px,3vw,42px)]">
        <div className="mt-[clamp(37px,3.85vw,61px)] block min-[851px]:grid min-[851px]:grid-cols-[minmax(0,1fr)_minmax(250px,0.33fr)] min-[851px]:items-end min-[851px]:gap-[clamp(35px,5vw,90px)]">
          <h2
            className="max-w-[900px] text-[clamp(34px,8vw,48px)] leading-[1.1] tracking-[-0.015em] min-[621px]:text-[clamp(38px,7vw,56px)] min-[851px]:text-[clamp(40px,4.5vw,68px)]"
            id="rt-ventures-title"
          >
            {headingLines.map((line, index) => (
              <SplitText
                key={line}
                text={line}
                className={index ? "text-[#707570]" : ""}
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
          <TextEffect
            className="mt-[35px] max-w-[340px] text-[15px] leading-[1.7] text-[var(--rt-copy)] min-[851px]:mt-0 min-[851px]:self-end min-[851px]:pb-3"
            preset="fade-in-blur"
            speedReveal={1.6}
            reduced={reduced}
          >
            {ecosystem?.description ||
              "A portfolio spanning gaming, brewing, consumer beverages, apparel and textiles. Each business has its own market and purpose."}
          </TextEffect>
        </div>
      </div>

      <div className="mx-auto mt-[clamp(39px,4.35vw,66px)] block w-full max-w-[1680px] px-[var(--rt-gutter)] min-[851px]:grid min-[851px]:grid-cols-[minmax(0,1fr)_minmax(0,0.94fr)] min-[851px]:items-start min-[851px]:gap-[clamp(21px,2.7vw,46px)] min-[1101px]:grid-cols-[minmax(0,1.09fr)_minmax(0,0.84fr)]">
        <div className="hidden h-full min-w-0 min-[851px]:block">
          <div className="sticky top-[5vh] top-[5svh]">
            <a
              ref={stageRef}
              className="relative isolate block h-[90vh] h-[90svh] w-full cursor-pointer overflow-hidden bg-[#cbd0c8]"
              href={current.href || `/ventures/${current.slug}`}
              data-transition-label={current.name}
              tabIndex={-1}
              aria-hidden="true"
            >
              {ventures.map((venture, index) => (
                <div
                  key={venture.id}
                  data-stage-panel={index}
                  className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden opacity-0 invisible [will-change:clip-path,opacity] [&_.rt-venture-art]:absolute [&_.rt-venture-art]:inset-0 [&_.rt-venture-art]:h-full [&_.rt-venture-art]:min-h-0 [&_.rt-venture-art]:w-full [&_.rt-venture-art]:origin-center [&_.rt-venture-art]:overflow-hidden [&_.rt-venture-art]:will-change-transform [&_.rt-venture-art]:[transform:translateZ(0)] [&_.rt-venture-art_img]:block [&_.rt-venture-art_img]:h-full [&_.rt-venture-art_img]:min-h-0 [&_.rt-venture-art_img]:w-full [&_.rt-venture-art_img]:object-cover [&_.rt-venture-art_img]:object-center [&_.rt-venture-art_img]:[backface-visibility:hidden] [&_.rt-venture-art_img]:[filter:saturate(.78)_contrast(1.01)]"
                >
                  <EditorialVisual
                    venture={venture}
                    content={content}
                    priority
                    imageOverride={venture.id === "sr18" ? technologyPhoto : undefined}
                  />
                </div>
              ))}
            </a>
            <div
              className="grid grid-cols-[1fr_auto] items-baseline gap-[22px] pt-[18px] text-xs text-[#6b7069]"
              aria-hidden="true"
            >
              <span className="relative inline-flex h-[1.45em] overflow-hidden text-[13px] font-medium text-[var(--rt-ink)] [&>span]:inline-block">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current.id}
                    initial={{ y: "110%", opacity: 0, filter: "blur(3px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "-110%", opacity: 0, filter: "blur(3px)" }}
                    transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {current.name}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span>{current.country}</span>
            </div>
          </div>
        </div>

        <div className="min-w-0" role="list" ref={listRef} onPointerLeave={() => setHovered(null)}>
          {ventures.map((venture, index) => (
            <article
              role="listitem"
              className="relative isolate transition-colors duration-500 ease-out"
              key={venture.id}
              data-venture-row
            >
              {desktop ? (
                <AnimatedBackgroundMark
                  active={index === displayed}
                  group={group}
                  className="absolute inset-0 -z-10 bg-[#f3f4f2]"
                  transition={HOVER_HIGHLIGHT_TRANSITION}
                />
              ) : null}
              <a
                className={`group relative isolate block min-h-0 px-0 py-[34px] text-[var(--rt-ink)] transition-colors duration-400 ease-[cubic-bezier(.16,1,.3,1)] before:absolute before:inset-0 before:-z-10 before:scale-[.985] before:bg-[#ecefe9] before:opacity-0 before:transition-[opacity,transform] before:duration-400 before:ease-[cubic-bezier(.16,1,.3,1)] hover:before:scale-100 hover:before:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current focus-visible:before:scale-100 focus-visible:before:opacity-100 min-[851px]:min-h-[clamp(192px,17vw,244px)] min-[851px]:px-[clamp(18px,1.9vw,30px)] min-[851px]:py-[clamp(24px,2.8vw,44px)] ${index === displayed ? "text-[#1c211c]" : "min-[851px]:text-[#8b8f88]"}`}
                href={venture.href || `/ventures/${venture.slug}`}
                aria-label={`Discover ${venture.name}`}
                data-transition-label={venture.name}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  setHovered(index);
                }}
                onFocus={() => {
                  setHovered(index);
                }}
                onBlur={() => setHovered(null)}
              >
                <span className="flex items-baseline justify-between gap-[18px] text-[11px] leading-[1.4] tracking-[0.004em] text-[#71766e]">
                  <span>{venture.industry}</span>
                  <span className="ml-auto">{venture.country}</span>
                </span>
                <span className="mt-[24px] flex origin-left items-center text-[clamp(1.9rem,7.8vw,3rem)] font-[440] leading-[1.1] tracking-[-0.017em] transition-transform duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 group-focus-visible:translate-x-1 min-[621px]:text-[clamp(2.2rem,6vw,3.45rem)] min-[851px]:mt-[clamp(22px,2.5vw,38px)] min-[851px]:text-[clamp(2rem,3.12vw,3.55rem)] [&_.aui-rolling]:inline-block [&_.aui-rolling]:min-w-0">
                  <RollingText
                    text={venture.name}
                    active={hovered === index}
                    reduced={reduced}
                    stagger={0.007}
                  />
                </span>
                <span className="mt-[18px] block max-w-full text-sm leading-[1.55] text-[#6b716b] transition-colors duration-400 ease-[cubic-bezier(.16,1,.3,1)] group-hover:text-[#474c45] group-focus-visible:text-[#474c45] min-[851px]:max-w-[330px] min-[851px]:text-[clamp(13px,.95vw,15px)]">
                  {venture.editorialSummary || venture.phrase}
                </span>
                <span
                  className="mt-7 block aspect-[1.16] w-full overflow-hidden min-[621px]:mt-[30px] min-[621px]:h-[clamp(280px,55vw,510px)] min-[621px]:aspect-auto min-[851px]:hidden [&_.rt-venture-art]:h-full [&_.rt-venture-art]:min-h-0 [&_.rt-venture-art_img]:h-full [&_.rt-venture-art_img]:w-full [&_.rt-venture-art_img]:object-cover"
                  aria-hidden="true"
                  data-image-reveal
                >
                    <EditorialVisual
                      venture={venture}
                      content={content}
                      imageOverride={venture.id === "sr18" ? technologyPhoto : undefined}
                    />
                </span>
              </a>
            </article>
          ))}
        </div>
      </div>
      <div
        className="mx-auto mt-[clamp(37px,3.85vw,61px)] flex w-full max-w-[1680px] flex-col items-start justify-between gap-6 px-[var(--rt-gutter)] text-[13px] leading-[1.6] text-[#777b74] min-[621px]:flex-row min-[621px]:items-center min-[621px]:gap-9"
        data-soft-reveal
      >
        {/* <span>Explore the people, products and industries behind each venture.</span> */}
        {/* <a
          className="group inline-flex shrink-0 items-center gap-3 self-start border-b border-current pb-1 text-[var(--rt-ink)] transition-opacity duration-500 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current min-[621px]:self-auto"
          href="#presence"
        >
          Across borders{" "}
          <ArrowUpRight
            className="transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            size={16}
            strokeWidth={1.4}
          />
        </a> */}
      </div>
    </section>
  );
}
