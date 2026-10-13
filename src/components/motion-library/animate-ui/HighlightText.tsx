import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Animate UI / Highlight Text — https://animate-ui.com/docs/primitives/texts/highlight
 * Source: github.com/imskyleen/animate-ui › registry/primitives/texts/highlight
 *
 * Kept: a background gradient whose `background-size` sweeps 0% → 100% from
 * the left once the phrase is in view.
 * Changed: `box-decoration-break: clone` so the sweep follows wrapped lines,
 * colour driven by CSS (`--aui-highlight`), reduced motion → highlighted.
 */
type HighlightTextProps = {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  reduced?: boolean;
};

export function HighlightText({
  text,
  className = "",
  delay = 0.25,
  duration = 1.4,
  reduced = false,
}: HighlightTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  return (
    <motion.span
      ref={ref}
      className={`aui-highlight ${className}`}
      data-library="animate-ui-highlight-text"
      initial={reduced ? false : { backgroundSize: "0% 100%" }}
      animate={reduced ? undefined : inView ? { backgroundSize: "100% 100%" } : undefined}
      transition={{ duration, delay, ease: [0.76, 0, 0.24, 1] }}
      style={reduced ? { backgroundSize: "100% 100%" } : undefined}
    >
      {text}
    </motion.span>
  );
}
