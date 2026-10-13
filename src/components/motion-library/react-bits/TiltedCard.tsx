import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, type SpringOptions } from "framer-motion";

/**
 * React Bits / TiltedCard (David Haz) — https://reactbits.dev/components/tilted-card
 * Source: github.com/DavidHDev/react-bits › src/ts-default/Components/TiltedCard
 *
 * Kept: spring-driven rotateX / rotateY from pointer offset, hover scale,
 * cursor-following caption whose rotation reacts to vertical velocity.
 * Changed: wraps any media (here a portrait that is also clip-revealed by
 * GSAP), mouse-only, amplitude kept small for an editorial page.
 */
const SPRING: SpringOptions = { damping: 30, stiffness: 100, mass: 2 };

type TiltedCardProps = {
  children: ReactNode;
  caption?: string;
  className?: string;
  innerClassName?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  reduced?: boolean;
};

export function TiltedCard({
  children,
  caption,
  className = "",
  innerClassName = "",
  rotateAmplitude = 7,
  scaleOnHover = 1.025,
  reduced = false,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const scale = useSpring(1, SPRING);
  const opacity = useSpring(0);
  const captionRotate = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });
  const lastY = useRef(0);

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;
    rotateX.set((offsetY / (rect.height / 2)) * -rotateAmplitude);
    rotateY.set((offsetX / (rect.width / 2)) * rotateAmplitude);
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
    captionRotate.set(-(offsetY - lastY.current) * 0.6);
    lastY.current = offsetY;
  }

  function enter(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function leave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    captionRotate.set(0);
  }

  return (
    <div
      ref={ref}
      className={`rb-tilted ${className}`}
      data-library="react-bits-tilted-card"
      onPointerMove={move}
      onPointerEnter={enter}
      onPointerLeave={leave}
    >
      <motion.div
        className={`rb-tilted-inner ${innerClassName}`}
        style={{ rotateX, rotateY, scale }}
      >
        {children}
      </motion.div>
      {caption ? (
        <motion.span
          className="rb-tilted-caption"
          aria-hidden="true"
          style={{ x, y, opacity, rotate: captionRotate }}
        >
          {caption}
        </motion.span>
      ) : null}
    </div>
  );
}
