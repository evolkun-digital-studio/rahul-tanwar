import { Fragment, useMemo, useRef, type ElementType } from "react";
import { motion, useInView, type Variants } from "framer-motion";

/**
 * motion-primitives / Text Effect (ibelick) — listed on 21st.dev ›
 * community › libraries › motion. https://motion-primitives.com/docs/text-effect
 * Source: github.com/ibelick/motion-primitives › components/core/text-effect.tsx
 *
 * Kept: per word / char / line segmentation, container stagger + item
 * variants, the `blur`, `fade-in-blur`, `slide` and `fade` presets and the
 * `speedReveal` / `speedSegment` controls.
 * Changed: the element is always rendered (no layout jump), animation starts
 * when it scrolls into view or when `trigger` flips, reduced-motion → static.
 */
type Preset = "blur" | "fade-in-blur" | "slide" | "fade";
type Per = "word" | "char" | "line";

const PRESETS: Record<Preset, Variants> = {
  blur: {
    hidden: { opacity: 0, filter: "blur(12px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  "fade-in-blur": {
    hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  slide: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};
const STAGGER: Record<Per, number> = { char: 0.03, word: 0.05, line: 0.1 };

type TextEffectProps = {
  children: string;
  as?: ElementType;
  per?: Per;
  preset?: Preset;
  className?: string;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  /** undefined = start in view; boolean = controlled */
  trigger?: boolean;
  reduced?: boolean;
};

export function TextEffect({
  children,
  as: Tag = "p",
  per = "word",
  preset = "fade-in-blur",
  className = "",
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger,
  reduced = false,
}: TextEffectProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const segments = useMemo(
    () => (per === "line" ? children.split("\n") : children.split(/(\s+)/)),
    [children, per],
  );
  const go = trigger ?? inView;
  const MotionTag = useMemo(() => motion.create(Tag), [Tag]);

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  const container: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: STAGGER[per] / speedReveal, delayChildren: delay } },
  };
  const item: Variants = {
    hidden: PRESETS[preset].hidden,
    visible: {
      ...(PRESETS[preset].visible as object),
      transition: { duration: 0.55 / speedSegment, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <MotionTag
      ref={ref}
      className={`mp-text-effect ${className}`}
      initial="hidden"
      animate={go ? "visible" : "hidden"}
      variants={container}
      data-library="motion-primitives-text-effect"
    >
      <span className="rt-visually-hidden">{children}</span>
      {segments.map((segment, index) => {
        if (per === "line") {
          return (
            <motion.span key={index} variants={item} className="mp-line" aria-hidden="true">
              {segment}
            </motion.span>
          );
        }
        if (/^\s+$/.test(segment)) return <Fragment key={index}>{segment}</Fragment>;
        if (per === "word") {
          return (
            <motion.span key={index} variants={item} className="mp-segment" aria-hidden="true">
              {segment}
            </motion.span>
          );
        }
        return (
          <span key={index} className="mp-segment" aria-hidden="true">
            {Array.from(segment).map((char, charIndex) => (
              <motion.span key={charIndex} variants={item} className="mp-segment">
                {char}
              </motion.span>
            ))}
          </span>
        );
      })}
    </MotionTag>
  );
}
