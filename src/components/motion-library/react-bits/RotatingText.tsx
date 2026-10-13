import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Target,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";

/**
 * React Bits / RotatingText (David Haz) — https://reactbits.dev/text-animations/rotating-text
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/RotatingText
 *
 * Kept: per-character AnimatePresence swap, spring transition, staggerFrom,
 * layout-animated wrapper so the pill resizes smoothly between words.
 * Added: `paused` (rotation starts after the hero intro), pause while the tab
 * is hidden, reduced-motion → first value only.
 */
type RotatingTextProps = {
  texts: string[];
  className?: string;
  elementClassName?: string;
  transition?: Transition;
  initial?: Target;
  animate?: TargetAndTransition;
  exit?: Target;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  paused?: boolean;
  reduced?: boolean;
  onNext?: (index: number) => void;
};

const segment = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }
  return Array.from(text);
};

export function RotatingText({
  texts,
  className = "",
  elementClassName = "",
  transition = { type: "spring", damping: 30, stiffness: 420 },
  initial = { y: "105%", opacity: 0 },
  animate = { y: 0, opacity: 1 },
  exit = { y: "-115%", opacity: 0 },
  rotationInterval = 2400,
  staggerDuration = 0.022,
  staggerFrom = "first",
  paused = false,
  reduced = false,
  onNext,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const words = useMemo(() => {
    const current = texts[index] ?? "";
    return current.split(" ").map((word, i, all) => ({
      characters: segment(word),
      needsSpace: i !== all.length - 1,
    }));
  }, [texts, index]);
  const total = words.reduce((sum, word) => sum + word.characters.length, 0);

  const delayFor = useCallback(
    (i: number) => {
      if (staggerFrom === "first") return i * staggerDuration;
      if (staggerFrom === "last") return (total - 1 - i) * staggerDuration;
      if (staggerFrom === "center") return Math.abs(Math.floor(total / 2) - i) * staggerDuration;
      return Math.abs(staggerFrom - i) * staggerDuration;
    },
    [staggerFrom, staggerDuration, total],
  );

  useEffect(() => {
    if (paused || reduced || texts.length < 2) return;
    let id = 0;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      const next = (indexRef.current + 1) % texts.length;
      indexRef.current = next;
      setIndex(next);
      onNextRef.current?.(next);
    };
    id = window.setInterval(tick, rotationInterval);
    return () => window.clearInterval(id);
  }, [paused, reduced, texts.length, rotationInterval]);

  if (reduced) return <span className={`rb-rotate ${className}`}>{texts[0]}</span>;

  let count = 0;
  return (
    <motion.span
      className={`rb-rotate ${className}`}
      layout
      transition={{ type: "spring", damping: 30, stiffness: 260 }}
    >
      <span className="rt-visually-hidden">{texts[index]}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={index} className="rb-rotate-inner" layout aria-hidden="true">
          {words.map((word, wordIndex) => (
            <span className="rb-rotate-word" key={wordIndex}>
              {word.characters.map((char, charIndex) => {
                const position = count++;
                return (
                  <motion.span
                    key={charIndex}
                    className={`rb-rotate-char ${elementClassName}`}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{ ...transition, delay: delayFor(position) }}
                  >
                    {char}
                  </motion.span>
                );
              })}
              {word.needsSpace ? <span className="rb-rotate-space"> </span> : null}
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
