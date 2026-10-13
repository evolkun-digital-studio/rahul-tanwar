import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { EditorialVisual, toEditorialVenture } from "@/components/site/EditorialVisual";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { Magnetic } from "@/components/motion-library/animate-ui/Magnetic";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { CursorArea } from "@/components/motion-library/animate-ui/Cursor";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import {
  AnimatedBackgroundMark,
  useAnimatedBackgroundGroup,
} from "@/components/motion-library/motion-primitives/AnimatedBackground";
import { VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { useMediaQuery, useReducedMotionPreference } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const VENTURE_ORDER = ["sr18", "delhi6", "volt50000", "masai", "adatto", "arnika"];

export function Ecosystem({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery("(min-width: 851px)");
  const finePointer = useMediaQuery("(pointer: fine)");
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
  const headingLines = (ecosystem?.heading || "Different ventures.|One way of building.")
    .split("|")
    .map((line) => line.trim());

  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const group = useAnimatedBackgroundGroup();
  const listRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLAnchorElement>(null);
  const previous = useRef(0);
  const depth = useRef(ventures.length + 2);

  // Scroll position chooses the venture on desktop (rows pass the reading line).
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !desktop) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-venture-row]"));
    const triggers = rows.map((row, index) =>
      ScrollTrigger.create({
        trigger: row,
        start: "top 58%",
        end: "bottom 42%",
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index),
      }),
    );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, [desktop, ventures.length]);

  // Initial stage state.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const panels = stage.querySelectorAll<HTMLElement>("[data-stage-panel]");
    panels.forEach((panel, index) =>
      gsap.set(panel, {
        autoAlpha: index === previous.current ? 1 : 0,
        zIndex: index === previous.current ? depth.current : 1,
      }),
    );
  }, [ventures.length]);

  // Directional clip-path wipe between ventures (GSAP).
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const from = previous.current;
    if (from === active) return;
    previous.current = active;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>("[data-stage-panel]"));
    const incoming = panels[active];
    const outgoing = panels[from];
    if (!incoming) return;
    depth.current += 1;
    const forward = active > from;
    // Only the latest venture may tidy up — a slower, older wipe must never hide a newer panel.
    const hideOthers = () => {
      if (previous.current !== active) return;
      panels.forEach((panel, index) => index !== active && gsap.set(panel, { autoAlpha: 0 }));
    };

    if (reduced) {
      gsap.set(incoming, { autoAlpha: 1, zIndex: depth.current, clipPath: "inset(0% 0% 0% 0%)" });
      hideOthers();
      return;
    }
    const incomingArt = incoming.querySelector<HTMLElement>(".rt-venture-art");
    const outgoingArt = outgoing?.querySelector<HTMLElement>(".rt-venture-art");
    gsap.killTweensOf([incoming, incomingArt, outgoingArt]);
    gsap.set(incoming, {
      autoAlpha: 1,
      zIndex: depth.current,
      clipPath: forward ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
    });
    gsap.to(incoming, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.05,
      ease: "power4.inOut",
      onComplete: hideOthers,
    });
    if (incomingArt)
      gsap.fromTo(
        incomingArt,
        { scale: 1.22, yPercent: forward ? 9 : -9 },
        { scale: 1, yPercent: 0, duration: 1.45, ease: "expo.out" },
      );
    if (outgoingArt)
      gsap.fromTo(
        outgoingArt,
        { yPercent: 0, scale: 1 },
        {
          yPercent: forward ? -12 : 12,
          scale: 1.04,
          duration: 1.05,
          ease: "power4.inOut",
          onComplete: () => void gsap.set(outgoingArt, { yPercent: 0, scale: 1 }),
        },
      );
  }, [active, reduced]);

  const current = ventures[active] || ventures[0];

  return (
    <section
      id="ventures"
      className="rt-ventures"
      data-home-tone="light"
      aria-labelledby="rt-ventures-title"
    >
      <div className="rt-shell rt-ventures-lead">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">
            {ecosystem?.eyebrow || "The Ecosystem — Rahul Tanwar Ventures"}
          </span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          <span className="rt-caption-aside">The portfolio</span>
        </div>
        <div className="rt-ventures-heading-row">
          <h2 className="rt-section-title" id="rt-ventures-title">
            {headingLines.map((line, index) => (
              <SplitText
                key={line}
                text={line}
                className={`rt-split-heading${index ? " rt-type-muted" : ""}`}
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
            className="rt-ventures-summary"
            preset="fade-in-blur"
            speedReveal={1.6}
            reduced={reduced}
          >
            {ecosystem?.description ||
              "A portfolio spanning gaming, brewing, consumer beverages, apparel and textiles. Each business has its own market and purpose."}
          </TextEffect>
        </div>
      </div>

      <div className="rt-shell rt-ventures-main">
        <div className="rt-stage-col">
          <div className="rt-stage">
            <CursorArea
              disabled={!finePointer || reduced}
              cursorClassName="rt-stage-cursor"
              label={
                <>
                  View
                  <ArrowUpRight size={15} strokeWidth={1.6} />
                </>
              }
            >
              <a
                ref={stageRef}
                className="rt-stage-media"
                href={current.href || `/ventures/${current.slug}`}
                data-transition-label={current.name}
                tabIndex={-1}
                aria-hidden="true"
              >
                {ventures.map((venture, index) => (
                  <div key={venture.id} data-stage-panel={index} className="rt-stage-panel">
                    <EditorialVisual venture={venture} content={content} priority />
                  </div>
                ))}
              </a>
            </CursorArea>
            <div className="rt-stage-meta" aria-hidden="true">
              <span className="rt-stage-name">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current.id}
                    initial={{ y: "110%", opacity: 0, filter: "blur(6px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "-110%", opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {current.name}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span>{current.country}</span>
            </div>
          </div>
        </div>

        <div
          className="rt-ventures-list"
          role="list"
          ref={listRef}
          onPointerLeave={() => setHovered(null)}
        >
          {ventures.map((venture, index) => (
            <article
              role="listitem"
              className={`rt-venture${index === active ? " is-current" : ""}`}
              key={venture.id}
              data-venture-row
            >
              {desktop ? (
                <AnimatedBackgroundMark
                  active={index === active}
                  group={group}
                  className="rt-venture-highlight"
                />
              ) : null}
              <a
                className="rt-venture-anchor"
                href={venture.href || `/ventures/${venture.slug}`}
                aria-label={`Discover ${venture.name}`}
                data-transition-label={venture.name}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  setHovered(index);
                  setActive(index);
                }}
                onFocus={() => {
                  setHovered(index);
                  setActive(index);
                }}
                onBlur={() => setHovered(null)}
              >
                <span className="rt-venture-top">
                  <span className="rt-venture-index">{String(index + 1).padStart(2, "0")}</span>
                  <span>{venture.industry}</span>
                  <span className="rt-venture-country">{venture.country}</span>
                </span>
                <span className="rt-venture-heading">
                  <RollingText text={venture.name} active={hovered === index} reduced={reduced} />
                  <Magnetic className="rt-venture-arrow" strength={0.3} max={8}>
                    <ArrowUpRight size={26} strokeWidth={1.2} aria-hidden="true" />
                  </Magnetic>
                </span>
                <span className="rt-venture-copy">
                  {venture.editorialSummary || venture.phrase}
                </span>
                <span className="rt-mobile-stage" aria-hidden="true" data-image-reveal>
                  <EditorialVisual venture={venture} content={content} />
                </span>
              </a>
            </article>
          ))}
        </div>
      </div>
      <div className="rt-shell rt-ventures-ending" data-soft-reveal>
        <span>Explore the people, products and industries behind each venture.</span>
        <a className="rt-text-link" href="#presence">
          Across borders <ArrowUpRight size={16} strokeWidth={1.4} />
        </a>
      </div>
    </section>
  );
}
