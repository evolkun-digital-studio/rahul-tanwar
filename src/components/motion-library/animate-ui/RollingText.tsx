import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { VISUALLY_HIDDEN } from "@/components/site/Shell";
import { cn } from "@/lib/utils";

/**
 * Animate UI / Rolling Text — https://animate-ui.com/docs/primitives/texts/rolling
 * Source: github.com/imskyleen/animate-ui › registry/primitives/texts/rolling
 *
 * Kept: two stacked copies of every character; the front copy turns away on
 * rotateX (origin 50% 25%) while the back copy turns in (origin 50% 100%),
 * staggered per character.
 * Changed: driven by an `active` prop (hover/focus of the parent link) instead
 * of in-view only, and it rolls back when the pointer leaves.
 */
type RollingTextProps = {
  text: string;
  active: boolean;
  className?: string;
  stagger?: number;
  reduced?: boolean;
};

const CHAR_BOX: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "inline-block",
  backfaceVisibility: "hidden",
};

export function RollingText({
  text,
  active,
  className = "",
  stagger = 0.018,
  reduced = false,
}: RollingTextProps) {
  const parts = useMemo(() => text.split(/(\s+)/), [text]);
  if (reduced) return <span className={className}>{text}</span>;
  let index = 0;
  return (
    <span className={cn("inline", className)} data-library="animate-ui-rolling-text">
      <span className={VISUALLY_HIDDEN}>{text}</span>
      {parts.map((part, partIndex) =>
        /^\s+$/.test(part) ? (
          <Fragment key={`s-${partIndex}`}>{part}</Fragment>
        ) : (
          <span
            key={`w-${partIndex}`}
            className="inline-block whitespace-nowrap"
            aria-hidden="true"
          >
            {Array.from(part).map((char, charIndex) => {
              const delay = index++ * stagger;
              return (
                <span
                  key={charIndex}
                  className="relative inline-block transform-3d perspective-[9999999px]"
                >
                  <motion.span
                    style={{ ...CHAR_BOX, transformOrigin: "50% 25%" }}
                    initial={false}
                    animate={{ rotateX: active ? 90 : 0, opacity: active ? 0 : 1 }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay }}
                  >
                    {char}
                  </motion.span>
                  <motion.span
                    style={{ ...CHAR_BOX, transformOrigin: "50% 100%" }}
                    initial={false}
                    animate={{ rotateX: active ? 0 : -90, opacity: active ? 1 : 0 }}
                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: delay + 0.06 }}
                  >
                    {char}
                  </motion.span>
                  <span style={{ visibility: "hidden" }}>{char}</span>
                </span>
              );
            })}
          </span>
        ),
      )}
    </span>
  );
}
