import { useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/**
 * Animate UI / Magnetic — https://animate-ui.com/docs/primitives/effects/magnetic
 * Source: github.com/imskyleen/animate-ui › registry/primitives/effects/magnetic
 *
 * Kept: pointer offset × strength → spring-smoothed x / y, release on leave.
 * Changed: clamped travel (`max`), mouse only, hit target never moves away
 * from the cursor on touch devices.
 */
type MagneticProps = { children: ReactNode; className?: string; strength?: number; max?: number };

export function Magnetic({ children, className = "", strength = 0.13, max = 6 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.42 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.42 });

  function move(event: ReactPointerEvent<HTMLSpanElement>) {
    if (reduced || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(Math.max(-max, Math.min(max, (event.clientX - rect.left - rect.width / 2) * strength)));
    y.set(Math.max(-max, Math.min(max, (event.clientY - rect.top - rect.height / 2) * strength)));
  }

  return (
    <motion.span
      ref={ref}
      className={`rt-magnetic ${className}`}
      style={{ x: springX, y: springY }}
      data-library="animate-ui-magnetic"
      onPointerMove={move}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
