import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";

/**
 * React Bits / ScrollVelocity (David Haz) — https://reactbits.dev/text-animations/scroll-velocity
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/ScrollVelocity
 *
 * Kept: base drift + scroll-velocity multiplier through useVelocity/useSpring,
 * direction flip when the reader scrolls up, wrapped copies.
 * Changed: the row component lives outside the parent (the original
 * re-declares it every render), frames are skipped while off-screen, and
 * reduced-motion renders one still row.
 */
type VelocityRowProps = {
  children: ReactNode;
  baseVelocity: number;
  className?: string;
  numCopies?: number;
  reduced?: boolean;
};

function useElementWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

function VelocityRow({
  children,
  baseVelocity,
  className = "",
  numCopies = 4,
  reduced = false,
}: VelocityRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(rowRef, { margin: "20% 0px 20% 0px" });
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const copyWidth = useElementWidth(copyRef);
  const x = useTransform(baseX, (value) => (copyWidth ? `${wrap(-copyWidth, 0, value)}px` : "0px"));
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="rb-velocity-row" ref={rowRef}>
      <motion.div className="rb-velocity-scroller" style={{ x: reduced ? 0 : x }}>
        {Array.from({ length: numCopies }, (_, index) => (
          <span
            className={className}
            key={index}
            ref={index === 0 ? copyRef : undefined}
            aria-hidden={index > 0 || undefined}
          >
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

type ScrollVelocityProps = {
  rows: ReactNode[];
  velocity?: number;
  className?: string;
  rowClassName?: (index: number) => string;
  reduced?: boolean;
  label?: string;
};

export function ScrollVelocity({
  rows,
  velocity = 42,
  className = "",
  rowClassName,
  reduced = false,
  label,
}: ScrollVelocityProps) {
  return (
    <div
      className={`rb-scroll-velocity ${className}`}
      data-library="react-bits-scroll-velocity"
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {rows.map((row, index) => (
        <VelocityRow
          key={index}
          baseVelocity={index % 2 ? -velocity : velocity}
          className={rowClassName?.(index) ?? ""}
          reduced={reduced}
        >
          {row}
        </VelocityRow>
      ))}
    </div>
  );
}
