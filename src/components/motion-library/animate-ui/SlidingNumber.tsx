import { useEffect } from "react";
import {
  motion,
  useSpring,
  useTransform,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";

/**
 * Animate UI / Sliding Number — https://animate-ui.com/docs/primitives/texts/sliding-number
 * Source: github.com/imskyleen/animate-ui › registry/primitives/texts/sliding-number
 *
 * Kept: one spring-driven "roller" per decimal place; each roller stacks the
 * ten digits and translates them by the spring's fractional value, so a
 * change from 2011 → 2023 physically rolls through the intermediate digits.
 * Changed: rollers are sized in `em` (no react-use-measure dependency),
 * optional zero padding, tabular numerals, reduced-motion → static text.
 */
type SlidingNumberProps = {
  value: number;
  /** minimum number of integer digits (zero-padded) */
  digits?: number;
  className?: string;
  transition?: SpringOptions;
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
    <motion.span className="aui-sliding-digit" style={{ y }}>
      {number}
    </motion.span>
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
    <span className="aui-sliding-roller" aria-hidden="true">
      <span className="aui-sliding-ghost">0</span>
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
  reduced = false,
}: SlidingNumberProps) {
  const safe = Math.max(0, Math.floor(Math.abs(value)));
  const text = String(safe).padStart(digits, "0");
  if (reduced) return <span className={`aui-sliding-number ${className}`}>{text}</span>;
  const places = Array.from({ length: text.length }, (_, index) =>
    Math.pow(10, text.length - index - 1),
  );
  return (
    <span className={`aui-sliding-number ${className}`} data-library="animate-ui-sliding-number">
      <span className="rt-visually-hidden">{text}</span>
      {places.map((place) => (
        <Roller key={place} value={safe} place={place} transition={transition} />
      ))}
    </span>
  );
}
