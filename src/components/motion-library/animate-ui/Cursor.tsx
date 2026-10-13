import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Animate UI / Cursor + Cursor Follow — https://animate-ui.com/docs/primitives/animate/cursor
 * Source: github.com/imskyleen/animate-ui › registry/primitives/animate/cursor
 *
 * Kept: a local (non-global) cursor provider — the native pointer is hidden
 * only inside the parent area, a custom cursor scales in on enter and out
 * on leave, and the follower is spring-smoothed.
 * Changed: provider/cursor/follow collapsed into one area component; mouse
 * pointers only (touch keeps native behaviour); label slot for "View".
 */
type CursorAreaProps = {
  children: ReactNode;
  label: ReactNode;
  className?: string;
  cursorClassName?: string;
  disabled?: boolean;
};

export function CursorArea({
  children,
  label,
  className = "",
  cursorClassName = "",
  disabled = false,
}: CursorAreaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 500, damping: 42, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 500, damping: 42, mass: 0.6 });

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nextX = event.clientX - rect.left;
    const nextY = event.clientY - rect.top;
    if (!active) {
      springX.jump(nextX);
      springY.jump(nextY);
      setActive(true);
    }
    x.set(nextX);
    y.set(nextY);
  };

  return (
    <div
      ref={ref}
      className={`aui-cursor-area ${active ? "is-cursor-active" : ""} ${className}`}
      data-library="animate-ui-cursor"
      onPointerMove={move}
      onPointerLeave={() => setActive(false)}
    >
      {children}
      <AnimatePresence>
        {active ? (
          <motion.span
            className={`aui-cursor ${cursorClassName}`}
            aria-hidden="true"
            style={{ left: springX, top: springY }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
