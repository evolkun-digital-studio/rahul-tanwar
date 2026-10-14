import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import { MILESTONES } from "@/lib/data";
import { useReducedMotionPreference } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const STAGES = ["Beginning", "Growth", "Signature", "Expansion"] as const;
const CARD_TONES = ["bg-[#f2f2f0]", "bg-[#ededeb]", "bg-[#e7e7e3]", "bg-[#e1e1dc]"] as const;

export function Milestones() {
  const reduced = useReducedMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const row = section.querySelector<HTMLElement>("[data-journey-row]");
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-journey-card]"));
    const panels = Array.from(section.querySelectorAll<HTMLElement>("[data-journey-panel]"));
    const topRows = Array.from(section.querySelectorAll<HTMLElement>("[data-journey-top-row]"));
    const bottomBlocks = Array.from(
      section.querySelectorAll<HTMLElement>("[data-journey-bottom-block]"),
    );
    if (!row || cards.length !== MILESTONES.length) return;

    const context = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (conditions) => {
          const {
            desktop,
            mobile,
            reduced: reduceMotion,
          } = conditions.conditions as {
            desktop?: boolean;
            mobile?: boolean;
            reduced?: boolean;
          };

          if (desktop) {
            const step = () => Math.min(56, Math.max(28, window.innerWidth * 0.028));
            const rowHeight = () => row.getBoundingClientRect().height;
            const finalOffset = (index: number) => (MILESTONES.length - 1 - index) * step();
            const startOffset = () => (MILESTONES.length - 1) * step() + rowHeight() * 0.18;

            gsap.set([...panels, ...topRows], { y: startOffset() });
            gsap.set(bottomBlocks, { y: 18, opacity: 0 });

            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: "top 108%",
                end: "bottom 30%",
                scrub: 0.28,
                invalidateOnRefresh: true,
              },
            });

            MILESTONES.forEach((_, index) => {
              const at = index * 0.18;
              timeline.to(
                [panels[index], topRows[index]],
                { y: () => finalOffset(index), duration: 0.82, ease: "power3.out" },
                at,
              );
              timeline.to(
                bottomBlocks[index],
                { y: 0, opacity: 1, duration: 0.42, ease: "power3.out" },
                at + 0.2,
              );
            });

            return () => timeline.kill();
          }

          if (mobile) {
            gsap.fromTo(
              cards,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.55,
                ease: "power2.out",
                stagger: 0.045,
                scrollTrigger: { trigger: row, start: "top 100%", once: true },
              },
            );
            return;
          }

          if (reduceMotion || reduced) {
            gsap.set([...panels, ...topRows, ...bottomBlocks, ...cards], {
              clearProps: "transform,opacity",
            });
          }
        },
      );
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(refresh);
    window.addEventListener("load", refresh, { once: true });

    return () => {
      window.removeEventListener("load", refresh);
      context.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="milestones"
      data-home-tone="light"
      aria-labelledby="journey-title"
      className="relative overflow-hidden bg-white py-14 text-[#171917] sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1680px] px-6 sm:px-8 lg:px-[clamp(32px,5.15vw,94px)]">
        <div className="mt-8 flex flex-col justify-between gap-7 sm:mt-10 lg:mt-12 lg:flex-row lg:items-end">
          <div>
            <h2
              id="journey-title"
              className="max-w-[12ch] text-[clamp(3.2rem,4vw,5rem)] font-[430] leading-[0.9] tracking-[-0.020em]"
            >
              <SplitText
                text="The journey so far."
                className="block"
                splitType="lines, words"
                mask="lines"
                from={{ yPercent: 110, rotate: 3 }}
                to={{ yPercent: 0, rotate: 0 }}
                stagger={0.035}
                duration={1}
                start="top 96%"
              />
            </h2>
          </div>

          <TextEffect
            className="max-w-[310px] text-[15px] leading-[1.65] text-[#626861] lg:mb-1"
            preset="fade-in-blur"
            speedReveal={1.3}
            reduced={reduced}
          >
            From engineering to an expanding portfolio of businesses, every step builds on the one
            before it.
          </TextEffect>
        </div>

        <ol
          className="mt-20 grid h-[clamp(320px,43vh,460px)] min-h-[320px] grid-cols-1 gap-1 overflow-hidden bg-transparent sm:grid-cols-2 lg:mt-14 lg:h-[clamp(380px,50vh,560px)] lg:min-h-[360px] lg:grid-cols-4"
          data-journey-row
        >
          {MILESTONES.map((milestone, index) => (
            <li
              key={milestone.year}
              data-journey-card
              className="relative min-h-[220px] overflow-hidden bg-white lg:min-h-0"
            >
              <div
                data-journey-panel
                aria-hidden="true"
                className={`absolute inset-0 will-change-transform ${CARD_TONES[index]}`}
              />
              <div
                data-journey-top-row
                className="absolute inset-x-5 top-5 z-10 flex items-baseline justify-between gap-3 text-[#747a72] sm:inset-x-6 sm:top-6"
              >
                <span className="text-[clamp(1.35rem,2vw,2rem)] font-[430] tracking-[-0.05em]">
                  {milestone.year}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {STAGES[index]}
                </span>
              </div>
              <div
                data-journey-bottom-block
                className="absolute inset-x-5 bottom-5 z-10 sm:inset-x-6 sm:bottom-6"
              >
                <p className="max-w-[27ch] text-[14px] leading-[1.5] text-[#272b27] sm:text-[15px]">
                  {milestone.body}
                </p>
                <span className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#858b82]">
                  {milestone.title}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
