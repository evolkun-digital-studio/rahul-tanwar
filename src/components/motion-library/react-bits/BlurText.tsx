import { Fragment, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { motion, type Transition } from "framer-motion";

/**
 * React Bits / BlurText (David Haz) — https://reactbits.dev/text-animations/blur-text
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/BlurText
 *
 * Kept: per-word (or letter) keyframes blur(10px) → blur(5px) → blur(0),
 * opacity 0 → .5 → 1 with a small overshoot on y, IntersectionObserver start.
 * Changed: inline output (works inside headings), accessible full text,
 * reduced-motion bypass, expo easing.
 */
type BlurTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  stepDuration?: number;
  threshold?: number;
  rootMargin?: string;
  reduced?: boolean;
  startDelay?: number;
};

export function BlurText({
  text,
  as: Tag = "span",
  className = "",
  delay = 90,
  animateBy = "words",
  direction = "bottom",
  stepDuration = 0.38,
  threshold = 0.2,
  rootMargin = "0px 0px -8% 0px",
  reduced = false,
  startDelay = 0,
}: BlurTextProps) {
  const elements = useMemo(
    () => (animateBy === "words" ? text.split(" ") : Array.from(text)),
    [text, animateBy],
  );
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, reduced]);

  const from = { filter: "blur(10px)", opacity: 0, y: direction === "top" ? -36 : 36 };
  const to = {
    filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
    opacity: [0, 0.5, 1],
    y: direction === "top" ? [-36, 4, 0] : [36, -4, 0],
  };

  return (
    <Tag ref={ref} className={`rb-blur-text ${className}`} data-library="react-bits-blur-text">
      <span className="rt-visually-hidden">{text}</span>
      {elements.map((segment, index) => {
        const transition: Transition = {
          duration: stepDuration * 2,
          times: [0, 0.5, 1],
          delay: startDelay + (index * delay) / 1000,
          ease: [0.16, 1, 0.3, 1],
        };
        return (
          <Fragment key={`${index}-${segment}`}>
            <motion.span
              aria-hidden="true"
              className="rb-blur-segment"
              initial={reduced ? false : from}
              animate={reduced ? undefined : inView ? to : from}
              transition={transition}
            >
              {segment === " " ? " " : segment}
            </motion.span>
            {animateBy === "words" && index < elements.length - 1 ? (
              <span aria-hidden="true"> </span>
            ) : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}
