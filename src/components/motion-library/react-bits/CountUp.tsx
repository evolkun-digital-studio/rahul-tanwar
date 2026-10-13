import { useCallback, useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

/**
 * React Bits / CountUp (David Haz) — https://reactbits.dev/text-animations/count-up
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/CountUp
 *
 * Kept: spring-driven count with damping/stiffness derived from duration,
 * once-in-view start, Intl grouping separator.
 * Changed: renders the final value first (no "0" flash for crawlers or
 * reduced motion) and only rewinds to `from` when the animation will run.
 */
type CountUpProps = {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
  separator?: string;
  reduced?: boolean;
};

export function CountUp({
  to,
  from = 0,
  delay = 0,
  duration = 2,
  className = "",
  separator = ",",
  reduced = false,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  });
  const isInView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const format = useCallback(
    (value: number) => {
      const formatted = Intl.NumberFormat("en-US", {
        useGrouping: Boolean(separator),
        maximumFractionDigits: 0,
      }).format(value);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [separator],
  );

  useEffect(() => {
    if (!ref.current || reduced) return;
    ref.current.textContent = format(from);
  }, [from, format, reduced]);

  useEffect(() => {
    if (!isInView || reduced) return;
    const id = window.setTimeout(() => motionValue.set(to), delay * 1000);
    return () => window.clearTimeout(id);
  }, [isInView, reduced, motionValue, to, delay]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      }),
    [springValue, format],
  );

  return (
    <span className={className} ref={ref} data-library="react-bits-count-up">
      {format(to)}
    </span>
  );
}
