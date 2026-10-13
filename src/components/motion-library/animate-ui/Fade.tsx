import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/**
 * Animate UI / Fade adapted for this portfolio's editorial motion grammar.
 * Documentation: https://animate-ui.com/docs/primitives/effects/fade
 * Follows its inView / inViewOnce / delay / initialOpacity model, using
 * the existing Framer Motion dependency. All content is rendered immediately.
 */
type FadeProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "p" | "span" | "figcaption" | "h3";
  delay?: number;
  duration?: number;
  initialOpacity?: number;
  y?: number;
  inViewOnce?: boolean;
  style?: CSSProperties;
};

export function Fade({
  as = "div",
  children,
  className,
  delay = 0,
  duration = 0.87,
  initialOpacity = 0.12,
  y = 20,
  inViewOnce = true,
  style,
}: FadeProps) {
  const reduceMotion = useReducedMotion();
  const MotionElement = motion[as] as typeof motion.div;
  return (
    <MotionElement
      data-library="animate-ui-fade"
      className={className}
      style={style}
      initial={reduceMotion ? false : { opacity: initialOpacity, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: inViewOnce, amount: 0.18, margin: "0px 0px -7% 0px" }}
      transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionElement>
  );
}
