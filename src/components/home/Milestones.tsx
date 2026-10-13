import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { SlidingNumber } from "@/components/motion-library/animate-ui/SlidingNumber";
import { TracingBeam } from "@/components/motion-library/inspira-ui/TracingBeam";
import { TextEffect } from "@/components/motion-library/motion-primitives/TextEffect";
import { TextShimmer } from "@/components/motion-library/motion-primitives/TextShimmer";
import { MILESTONES } from "@/lib/data";
import { useReducedMotionPreference } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.16, 1, 0.3, 1] as const;

function BigYear({ year, reduced }: { year: string; reduced: boolean }) {
  const numeric = /^\d{4}$/.test(year);
  return (
    <span className="rt-journey-bigyear" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        {numeric ? (
          <motion.span
            key="number"
            className="rt-journey-bigyear-inner"
            initial={{ y: "-60%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-60%", opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <SlidingNumber
              value={Number(year)}
              digits={4}
              reduced={reduced}
              transition={{ stiffness: 140, damping: 20, mass: 0.6 }}
            />
          </motion.span>
        ) : (
          <motion.span
            key="word"
            className="rt-journey-bigyear-inner rt-journey-bigyear-word"
            initial={{ y: "60%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "60%", opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {year}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function Milestones() {
  const reduced = useReducedMotionPreference();
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const current = MILESTONES[active];

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-journey-item]"));
    const triggers = items.map((item, index) =>
      ScrollTrigger.create({
        trigger: item,
        start: "top 62%",
        end: "bottom 62%",
        onEnter: () => setActive(index),
        onEnterBack: () => setActive(index),
      }),
    );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, []);

  return (
    <section
      className="rt-journey"
      id="milestones"
      data-home-tone="light"
      aria-labelledby="rt-journey-title"
    >
      <div className="rt-shell">
        <div className="rt-section-caption" data-soft-reveal>
          <span className="rt-eyebrow">Milestones</span>
          {/* <span className="rt-caption-rule" aria-hidden="true" /> */}
          <span className="rt-caption-aside">A continuing story</span>
        </div>
        <div className="rt-journey-layout">
          <div className="rt-journey-heading">
            <h2 className="rt-section-title" id="rt-journey-title">
              <SplitText
                text="The journey"
                className="rt-split-heading"
                splitType="lines, chars"
                mask="lines"
                from={{ yPercent: 110, rotate: 4 }}
                to={{ yPercent: 0, rotate: 0 }}
                stagger={0.03}
                duration={1.2}
              />
              <SplitText
                text="so far."
                className="rt-split-heading rt-type-muted"
                splitType="lines, words"
                mask="lines"
                from={{ yPercent: 105 }}
                to={{ yPercent: 0 }}
                stagger={0.08}
                duration={1.2}
                delay={0.18}
              />
            </h2>
            <div className="rt-journey-now" aria-hidden="true">
              <BigYear year={current.year} reduced={reduced} />
              <div className="rt-journey-now-meta">
                <span className="rt-journey-now-count">
                  {String(active + 1).padStart(2, "0")} /{" "}
                  {String(MILESTONES.length).padStart(2, "0")}
                </span>
                <span className="rt-journey-now-title">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={current.title}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                    >
                      {current.title}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </div>
            <TextEffect
              className="rt-journey-intro"
              preset="fade-in-blur"
              speedReveal={1.4}
              reduced={reduced}
            >
              From engineering to an expanding portfolio of businesses.
            </TextEffect>
          </div>
          <TracingBeam className="rt-journey-timeline" reduced={reduced}>
            <ol className="rt-journey-list" ref={listRef}>
              {MILESTONES.map((milestone, index) => (
                <li
                  key={milestone.year}
                  className={`rt-journey-item${index === active ? " is-current" : ""}${index <= active ? " is-reached" : ""}`}
                  data-journey-item
                >
                  <span className="rt-journey-marker" aria-hidden="true" />
                  <span className="rt-journey-year">
                    {milestone.year === "Now" ? (
                      <TextShimmer className="rt-journey-shimmer">Now</TextShimmer>
                    ) : (
                      milestone.year
                    )}
                  </span>
                  <div className="rt-journey-details">
                    <h3>{milestone.title}</h3>
                    <p>{milestone.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </TracingBeam>
        </div>
      </div>
    </section>
  );
}
