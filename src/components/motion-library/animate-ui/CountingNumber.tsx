import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, type SpringOptions } from "framer-motion";

/**
 * Animate UI / Counting Number — https://animate-ui.com/docs/primitives/texts/counting-number
 * Source: github.com/imskyleen/animate-ui › registry/primitives/texts/counting-number
 *
 * Kept: motion value → spring → textContent writes (no React re-render per
 * frame), in-view-once start, zero padding.
 * Changed: the final number is server/initial text so the stat is never
 * read as "0"; it only rewinds when the animation is about to play.
 */
type CountingNumberProps = {
  number: number;
  padStart?: number;
  className?: string;
  delay?: number;
  transition?: SpringOptions;
  reduced?: boolean;
};

export function CountingNumber({
  number,
  padStart = 2,
  className = "",
  delay = 0,
  transition = { stiffness: 60, damping: 26 },
  reduced = false,
}: CountingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const value = useMotionValue(0);
  const spring = useSpring(value, transition);
  const format = (latest: number) => String(Math.round(latest)).padStart(padStart, "0");

  useEffect(() => {
    if (!reduced && ref.current) ref.current.textContent = format(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setTimeout(() => value.set(number), delay * 1000);
    return () => window.clearTimeout(id);
  }, [inView, reduced, value, number, delay]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spring],
  );

  return (
    <span ref={ref} className={className} data-library="animate-ui-counting-number">
      {format(number)}
    </span>
  );
}
