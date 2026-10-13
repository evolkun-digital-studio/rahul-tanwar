import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useVelocity,
} from "framer-motion";

/**
 * React Bits / CircularText (David Haz) — https://reactbits.dev/text-animations/circular-text
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/CircularText
 *
 * Kept: letters distributed with rotateZ around the ring, continuous spin,
 * `onHover="speedUp"` behaviour.
 * Changed: rotation is integrated per-frame so hover and scroll velocity can
 * accelerate it smoothly (spring) instead of restarting tweens; reduced-motion
 * keeps the ring still. Centre slot accepts an icon.
 */
type CircularTextProps = {
  text: string;
  spinDuration?: number;
  className?: string;
  children?: ReactNode;
  reduced?: boolean;
};

export function CircularText({
  text,
  spinDuration = 18,
  className = "",
  children,
  reduced = false,
}: CircularTextProps) {
  const letters = Array.from(text);
  const rotation = useMotionValue(0);
  const hoverBoost = useMotionValue(1);
  const smoothBoost = useSpring(hoverBoost, { stiffness: 90, damping: 18 });
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothScroll = useSpring(scrollVelocity, { stiffness: 120, damping: 30 });
  const rootRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rootRef);

  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return;
    const base = 360 / spinDuration;
    const scrollBoost = Math.min(6, Math.abs(smoothScroll.get()) / 260);
    rotation.set(
      (rotation.get() + base * (smoothBoost.get() + scrollBoost) * (delta / 1000)) % 360,
    );
  });

  return (
    <span
      ref={rootRef}
      className={`rb-circular ${className}`}
      data-library="react-bits-circular-text"
      onPointerEnter={() => hoverBoost.set(4)}
      onPointerLeave={() => hoverBoost.set(1)}
    >
      <motion.span className="rb-circular-ring" style={{ rotate: rotation }} aria-hidden="true">
        {letters.map((letter, index) => (
          <span key={index} style={{ transform: `rotate(${(360 / letters.length) * index}deg)` }}>
            {letter}
          </span>
        ))}
      </motion.span>
      {children ? <span className="rb-circular-center">{children}</span> : null}
    </span>
  );
}
