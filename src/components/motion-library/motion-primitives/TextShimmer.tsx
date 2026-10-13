import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * motion-primitives / Text Shimmer (ibelick) — listed on 21st.dev ›
 * community › libraries › motion. https://motion-primitives.com/docs/text-shimmer
 * Source: github.com/ibelick/motion-primitives › components/core/text-shimmer.tsx
 *
 * Kept: a highlight band (`--spread` derived from text length) swept across
 * clipped text by animating background-position.
 * Changed: CSS keyframes instead of a per-instance motion loop, so a quiet
 * label costs nothing on the main thread; paused for reduced motion.
 */
type TextShimmerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  length?: number;
};

export function TextShimmer({
  children,
  as: Tag = "span",
  className = "",
  duration = 2.6,
  spread = 2,
  length = 16,
}: TextShimmerProps) {
  const style = {
    "--mp-shimmer-spread": `${length * spread}px`,
    "--mp-shimmer-duration": `${duration}s`,
  } as CSSProperties;
  return (
    <Tag
      className={`mp-text-shimmer ${className}`}
      style={style}
      data-library="motion-primitives-text-shimmer"
    >
      {children}
    </Tag>
  );
}
