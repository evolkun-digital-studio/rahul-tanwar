import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowDown } from "lucide-react";
import { SlidingNumber } from "@/components/motion-library/animate-ui/SlidingNumber";
import { VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { useMediaQuery, useReducedMotionPreference } from "@/lib/motion";
import { Shell } from "@/components/site/Shell";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, SplitText);

const BIOGRAPHY = [
  "His portfolio spans gaming, brewing, beverages, apparel and manufacturing. Different categories, with the same focus on product and execution.",
  "He works across the ideas behind a brand and the operations that make it real — from what customers experience to how the business delivers it.",
  "The approach is practical: build with purpose, earn trust over time and keep improving what matters.",
];
const ROW_LABELS = ["Focus", "Method", "Horizon"];
const HEADING = ["A builder.", "An operator.", "An owner."];
// One grammar: reveals ease out, wipes and rules ease in-out.
const REVEAL = "expo.out";
const WIPE = "power4.inOut";
const ROLL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ROLL_SECONDS = 1.4;
const ROLL_STAGGER = 0.12;

/* Hairline rules that GSAP draws in (scaleX from the left). */
const RULE_TOP = "absolute inset-x-0 top-0 h-px origin-left bg-hairline";
const RULE_BOTTOM = "absolute inset-x-0 bottom-0 h-px origin-left bg-hairline";
/* "Follow the journey": the underline draws left → right, the arrow nudges down. */
const LINK =
  "group/link relative mt-10 inline-flex items-center gap-2.5 pb-1.5 text-[15px] font-medium text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-current after:[transform:scaleX(0)] after:[transition:transform_0.6s_var(--ease-rule)] after:content-[''] hover:after:[transform:scaleX(1)] focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-accent focus-visible:after:[transform:scaleX(1)] motion-reduce:after:[transition:none]";
const LINK_ARROW =
  "[transition:transform_0.4s_var(--ease-expo)] group-hover/link:[transform:translateY(3px)] group-focus-visible/link:[transform:translateY(3px)] motion-reduce:[transition:none]";
/* Stat cell: number above label from 360px; below that the cells stack as rows. */
const STAT =
  "relative flex flex-row-reverse items-baseline justify-between py-5 [--rt-about-divider:1] min-[360px]:flex-col-reverse min-[360px]:[align-items:normal] min-[360px]:justify-end min-[360px]:gap-2.5 min-[360px]:pt-8 min-[360px]:pb-0";
/* Divider before every stat but the first: a vertical hairline that GSAP grows via
   --rt-about-divider; below 360px it becomes a horizontal rule. */
const STAT_DIVIDER =
  "min-[360px]:pl-[clamp(16px,2.5vw,40px)] before:absolute before:top-0 before:right-0 before:left-0 before:h-px before:origin-left before:bg-hairline before:[transform:scaleX(var(--rt-about-divider))] before:content-[''] min-[360px]:before:right-auto min-[360px]:before:bottom-0 min-[360px]:before:h-auto min-[360px]:before:w-px min-[360px]:before:origin-top min-[360px]:before:[transform:scaleY(var(--rt-about-divider))]";

export function Founder({ content }: { content: PageCmsContent }) {
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const rootRef = useRef<HTMLElement>(null);
  const [rolling, setRolling] = useState(false);

  const about = content.sections.manBehind as
    | { eyebrow?: string; introduction?: string; paragraphs?: string[]; labels?: string[] }
    | undefined;
  const paragraphs = about?.paragraphs?.length ? about.paragraphs : BIOGRAPHY;
  const labels = paragraphs.map(
    (_, index) => about?.labels?.[index] || ROW_LABELS[index] || ROW_LABELS[ROW_LABELS.length - 1],
  );
  const lead =
    about?.introduction ||
    "Rahul Tanwar is a Dubai-based founder with businesses across the UAE and India.";
  const ecosystem = content.sections.ecosystem as { ventures?: typeof VENTURES } | undefined;
  const ventureCount = (ecosystem?.ventures?.length ? ecosystem.ventures : VENTURES).length;
  const stats = [
    { value: ventureCount, label: "Ventures" },
    { value: 5, label: "Industries" },
    { value: 2, label: "Markets" },
  ];

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const q = <T extends Element = HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));
    const one = (selector: string) => root.querySelector<HTMLElement>(selector)!;
    const once = (trigger: Element, start: string) => ({ trigger, start, once: true });

    const ctx = gsap.context(() => {
      // Caption: the rule draws, then the words lift.
      gsap
        .timeline({ scrollTrigger: once(root, "top 85%") })
        .fromTo(
          one('[data-about="caption-rule"]'),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.1, ease: WIPE },
        )
        .fromTo(
          q('[data-about="caption"] > span'),
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.6, ease: REVEAL },
          0.15,
        );

      // Heading: each line rises out of its own mask. No rotation.
      gsap.fromTo(
        q('[data-about="line"]'),
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 1.1,
          ease: REVEAL,
          stagger: 0.09,
          scrollTrigger: once(one('[data-about="title"]'), "top 80%"),
        },
      );

      // Portrait: the frame wipes up while the image settles inside it.
      const frame = one('[data-about="frame"]');
      gsap
        .timeline({ scrollTrigger: once(frame, "top 80%") })
        .fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: WIPE },
        )
        .fromTo(
          one('[data-about="scale"]'),
          { scale: 1.18 },
          { scale: 1.04, duration: 1.8, ease: REVEAL },
          0,
        );

      if (desktop) {
        // Drift inside the frame while the portrait is pinned (scale 1.04 hides the edges).
        gsap.fromTo(
          one('[data-about="drift"]'),
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: one('[data-about="body"]'),
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
        // Reading progress: fills from the lead to the end of the last row.
        const rows = q('[data-about="row"]');
        gsap.fromTo(
          one('[data-about="progress-fill"]'),
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: one('[data-about="lead"]'),
              start: "top 70%",
              endTrigger: rows[rows.length - 1],
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
      }

      // Lead: masked lines; re-split on resize so the breaks stay true.
      SplitText.create(one('[data-about="lead"]'), {
        type: "lines",
        mask: "lines",
        linesClass: "will-change-transform",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            duration: 1,
            ease: REVEAL,
            stagger: 0.08,
            scrollTrigger: once(self.elements[0] || root, "top 82%"),
          }),
      });

      // How he works: rule draws, label lifts, paragraph follows. The link rides with the last row.
      const rows = q('[data-about="row"]');
      rows.forEach((row, index) => {
        const tl = gsap.timeline({ scrollTrigger: once(row, "top 85%") });
        tl.fromTo(
          row.querySelector('[data-about="row-rule"]'),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: WIPE },
        )
          .fromTo(
            row.querySelector('[data-about="row-label"]'),
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.6, ease: REVEAL },
            0.15,
          )
          .fromTo(
            row.querySelector('[data-about="row-text"]'),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.8, ease: REVEAL },
            0.25,
          );
        if (index === rows.length - 1)
          tl.fromTo(
            one('[data-about="link"]'),
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.8, ease: REVEAL },
            0.35,
          );
      });

      // Stats: the band's rule, then the dividers, then the numbers roll up and the labels land.
      const labelsEls = q('[data-about="stat"] dt');
      gsap
        .timeline({ scrollTrigger: once(one('[data-about="stats"]'), "top 85%") })
        .fromTo(
          one('[data-about="stats-rule"]'),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, ease: WIPE },
        )
        .fromTo(
          q('[data-about="stat"] + [data-about="stat"]'),
          { "--rt-about-divider": 0 },
          { "--rt-about-divider": 1, duration: 0.8, ease: WIPE, stagger: 0.1 },
          0,
        )
        .call(() => setRolling(true), [], 0)
        .add(
          labelsEls.map((label, index) =>
            gsap.fromTo(
              label,
              { autoAlpha: 0, y: 6 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                ease: REVEAL,
                delay: index * ROLL_STAGGER + ROLL_SECONDS + 0.3,
              },
            ),
          ),
          0,
        );
    }, root);
    return () => ctx.revert();
  }, [reduced, desktop]);

  return (
    <section
      className="relative bg-page py-[var(--rt-section-space)] text-ink"
      id="about"
      data-home-tone="light"
      aria-labelledby="rt-about-title"
      ref={rootRef}
    >
      <Shell className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-[clamp(24px,3vw,48px)]">
        {/* 1 — caption row with a hairline underneath */}
        <div
          className="relative flex justify-between gap-6 pb-3.5 text-[12px] leading-[1.5] text-muted lg:col-span-full"
          data-about="caption"
        >
          <span>{about?.eyebrow || "The man behind the brands"}</span>
          <span>The founder</span>
          <i className={RULE_BOTTOM} data-about="caption-rule" aria-hidden="true" />
        </div>

        {/* 2 — three-line heading, each line in its own mask */}
        <h2
          className="mt-[clamp(32px,4vw,56px)] text-[clamp(48px,6vw,96px)] leading-[1.02] font-medium tracking-[-0.035em] lg:col-span-full"
          id="rt-about-title"
          data-about="title"
          aria-label={HEADING.join(" ")}
        >
          {HEADING.map((line, index) => (
            <span
              className={cn(
                "-mb-[0.06em] block overflow-clip pb-[0.06em]",
                index === HEADING.length - 1 && "text-muted",
              )}
              key={line}
              aria-hidden="true"
            >
              <span className="block will-change-transform" data-about="line">
                {line}
              </span>
            </span>
          ))}
        </h2>

        {/* 3 — portrait + text */}
        <div
          className="mt-[clamp(56px,8vw,120px)] grid grid-cols-1 gap-10 lg:col-span-full lg:grid-cols-subgrid lg:[align-items:start] lg:gap-x-[clamp(24px,3vw,48px)] lg:gap-y-0"
          data-about="body"
        >
          <figure className="lg:sticky lg:top-[120px] lg:col-start-1 lg:col-end-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface" data-about="frame">
              <div className="absolute inset-0 will-change-transform" data-about="drift">
                <div
                  className="absolute inset-0 will-change-transform [transform:scale(1.04)]"
                  data-about="scale"
                >
                  <Image
                    className="block size-full object-cover"
                    src="/images/about/rahul-portrait-duotone.webp"
                    width={1086}
                    height={1357}
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    alt="Rahul Tanwar, founder of Rahul Tanwar Ventures"
                  />
                </div>
              </div>
            </div>
            <div className="relative mt-4 hidden h-px bg-hairline lg:block" aria-hidden="true">
              <i
                className="absolute inset-0 origin-left bg-accent [transform:scaleX(0)] motion-reduce:[transform:none]"
                data-about="progress-fill"
              />
            </div>
            <figcaption className="mt-3.5 flex items-start justify-between gap-4 text-[12px] leading-[1.5] text-body">
              <span>
                Rahul Tanwar
                <br />
                Founder, Rahul Tanwar Ventures
              </span>
              <span className="text-muted">Dubai</span>
            </figcaption>
          </figure>

          <div className="max-w-[600px] lg:col-start-7 lg:col-end-13 lg:pb-[clamp(40px,5vw,80px)]">
            <p
              className="text-[clamp(22px,2.2vw,32px)] leading-[1.35] tracking-[-0.015em] text-ink"
              data-about="lead"
            >
              {lead}
            </p>
            <div className="mt-14">
              {paragraphs.map((paragraph, index) => (
                <div
                  className="relative grid grid-cols-1 gap-2 pt-5 pb-7 lg:grid-cols-[120px_minmax(0,1fr)] lg:gap-0 lg:pb-[clamp(56px,7vw,112px)]"
                  data-about="row"
                  key={`${index}-${paragraph.slice(0, 12)}`}
                >
                  <i className={RULE_TOP} data-about="row-rule" aria-hidden="true" />
                  <p className="text-[12px] leading-[1.6] text-muted" data-about="row-label">
                    {labels[index]}
                  </p>
                  <p
                    className="max-w-[52ch] text-[17px] leading-[1.65] text-body"
                    data-about="row-text"
                  >
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>
            <a className={LINK} href="#milestones" data-about="link">
              <span>Follow the journey</span>
              <ArrowDown className={LINK_ARROW} size={16} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* 4 — stats band */}
        <div className="relative mt-[clamp(80px,10vw,160px)] lg:col-span-full" data-about="stats">
          <i className={RULE_TOP} data-about="stats-rule" aria-hidden="true" />
          <dl className="grid grid-cols-1 min-[360px]:grid-cols-3">
            {stats.map((stat, index) => (
              <div
                className={cn(STAT, index > 0 && STAT_DIVIDER)}
                data-about="stat"
                key={stat.label}
              >
                <dt className="text-[13px] leading-[1.4] text-muted">{stat.label}</dt>
                <dd className="text-[48px] leading-none font-normal tracking-[-0.04em] text-ink tabular-nums lg:text-[clamp(64px,8vw,128px)]">
                  <SlidingNumber
                    value={stat.value}
                    digits={2}
                    reduced={reduced}
                    play={rolling}
                    tween={{ duration: ROLL_SECONDS, ease: ROLL_EASE, delay: index * ROLL_STAGGER }}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Shell>
    </section>
  );
}
