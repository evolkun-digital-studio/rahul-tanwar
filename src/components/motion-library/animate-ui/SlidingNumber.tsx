import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Easing,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import { VISUALLY_HIDDEN } from "@/components/site/Shell";
import { cn } from "@/lib/utils";

/* aui-sliding-* class names stay on the elements as hooks for section CSS (e.g. the milestones year). */
const ROLLER = "aui-sliding-roller relative inline-block overflow-hidden leading-none";
const GHOST = "aui-sliding-ghost invisible";
const DIGIT = "aui-sliding-digit absolute inset-0 flex items-center justify-center";
const NUMBER = "aui-sliding-number inline-flex items-center tabular-nums";

/**
 * Animate UI / Sliding Number — https://animate-ui.com/docs/primitives/texts/sliding-number
 * Source: github.com/imskyleen/animate-ui › registry/primitives/texts/sliding-number
 *
 * Kept: one spring-driven "roller" per decimal place; each roller stacks the
 * ten digits and translates them by the spring's fractional value, so a
 * change from 2011 → 2023 physically rolls through the intermediate digits.
 * Changed: rollers are sized in `em` (no react-use-measure dependency),
 * optional zero padding, tabular numerals, reduced-motion → static text.
 * Optional `tween`: a timed odometer roll (duration + easing) instead of the
 * spring, started from zero when `play` turns true (e.g. on scroll).
 */
type SlidingTween = { duration: number; ease?: Easing; delay?: number };
type SlidingNumberProps = {
  value: number;
  /** minimum number of integer digits (zero-padded) */
  digits?: number;
  className?: string;
  transition?: SpringOptions;
  /** roll with a timed tween instead of a spring */
  tween?: SlidingTween;
  /** tween mode only: rollers rest at 0 until this turns true */
  play?: boolean;
  reduced?: boolean;
};

function Digit({ motionValue, number }: { motionValue: MotionValue<number>; number: number }) {
  const y = useTransform(motionValue, (latest) => {
    const current = ((latest % 10) + 10) % 10;
    let offset = (10 + number - current) % 10;
    if (offset > 5) offset -= 10;
    return `${offset * 100}%`;
  });
  return (
    <motion.span className={DIGIT} style={{ y }}>
      {number}
    </motion.span>
  );
}

function TweenRoller({
  value,
  place,
  tween,
  play,
}: {
  value: number;
  place: number;
  tween: SlidingTween;
  play: boolean;
}) {
  const target = Math.floor(value / place) % 10;
  const progress = useMotionValue(play ? target : 0);
  const { duration, ease, delay } = tween;
  useEffect(() => {
    if (!play) return;
    const controls = animate(progress, target, { duration, ease, delay });
    return () => controls.stop();
  }, [progress, target, play, duration, ease, delay]);
  return (
    <span className={ROLLER} aria-hidden="true">
      <span className={GHOST}>0</span>
      {Array.from({ length: 10 }, (_, number) => (
        <Digit key={number} motionValue={progress} number={number} />
      ))}
    </span>
  );
}

function Roller({
  value,
  place,
  transition,
}: {
  value: number;
  place: number;
  transition: SpringOptions;
}) {
  const target = Math.floor(value / place) % 10;
  const spring = useSpring(target, transition);
  useEffect(() => {
    spring.set(target);
  }, [spring, target]);
  return (
    <span className={ROLLER} aria-hidden="true">
      <span className={GHOST}>0</span>
      {Array.from({ length: 10 }, (_, number) => (
        <Digit key={number} motionValue={spring} number={number} />
      ))}
    </span>
  );
}

export function SlidingNumber({
  value,
  digits = 1,
  className = "",
  transition = { stiffness: 200, damping: 22, mass: 0.45 },
  tween,
  play = true,
  reduced = false,
}: SlidingNumberProps) {
  const safe = Math.max(0, Math.floor(Math.abs(value)));
  const text = String(safe).padStart(digits, "0");
  if (reduced) return <span className={cn(NUMBER, className)}>{text}</span>;
  const places = Array.from({ length: text.length }, (_, index) =>
    Math.pow(10, text.length - index - 1),
  );
  return (
    <span className={cn(NUMBER, className)} data-library="animate-ui-sliding-number">
      <span className={VISUALLY_HIDDEN}>{text}</span>
      {places.map((place) =>
        tween ? (
          <TweenRoller key={place} value={safe} place={place} tween={tween} play={play} />
        ) : (
          <Roller key={place} value={safe} place={place} transition={transition} />
        ),
      )}
    </span>
  );
}
