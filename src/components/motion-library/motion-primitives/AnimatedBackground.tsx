import { useId } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";

/**
 * motion-primitives / Animated Background (ibelick) — listed on 21st.dev ›
 * community › libraries › motion. https://motion-primitives.com/docs/animated-background
 * Source: github.com/ibelick/motion-primitives › components/core/animated-background.tsx
 *
 * Kept: one shared `layoutId` highlight that glides between items instead of
 * fading per item.
 * Changed: controlled — the parent decides which item is active (scroll
 * position OR hover), and each item renders <AnimatedBackgroundMark />.
 */
type MarkProps = { active: boolean; group: string; className?: string; transition?: Transition };

export function useAnimatedBackgroundGroup() {
  return `mp-bg-${useId()}`;
}

export function AnimatedBackgroundMark({
  active,
  group,
  className = "",
  transition = { type: "spring", bounce: 0.12, duration: 0.6 },
}: MarkProps) {
  return (
    <AnimatePresence initial={false}>
      {active ? (
        <motion.span
          layoutId={group}
          className={`mp-animated-bg ${className}`}
          aria-hidden="true"
          transition={transition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-library="motion-primitives-animated-background"
        />
      ) : null}
    </AnimatePresence>
  );
}
