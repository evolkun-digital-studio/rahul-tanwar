/**
 * motion-primitives / Progressive Blur (ibelick) — listed on 21st.dev ›
 * community › libraries › motion. https://motion-primitives.com/docs/progressive-blur
 * Source: github.com/ibelick/motion-primitives › components/core/progressive-blur.tsx
 *
 * Kept: stacked backdrop-filter layers, each masked to a sliding band of a
 * linear gradient so blur increases smoothly toward one edge.
 * Changed: plain divs (no per-layer motion props needed here).
 */
const ANGLES = { top: 0, right: 90, bottom: 180, left: 270 } as const;

type ProgressiveBlurProps = {
  direction?: keyof typeof ANGLES;
  blurLayers?: number;
  blurIntensity?: number;
  className?: string;
};

export function ProgressiveBlur({
  direction = "bottom",
  blurLayers = 7,
  blurIntensity = 0.55,
  className = "",
}: ProgressiveBlurProps) {
  const layers = Math.max(blurLayers, 2);
  const segment = 1 / (blurLayers + 1);
  return (
    <div
      className={`mp-progressive-blur ${className}`}
      aria-hidden="true"
      data-library="motion-primitives-progressive-blur"
    >
      {Array.from({ length: layers }, (_, index) => {
        const stops = [index, index + 1, index + 2, index + 3].map(
          (position, stop) =>
            `${stop === 1 || stop === 2 ? "var(--rt-ink)" : "transparent"} ${position * segment * 100}%`,
        );
        const gradient = `linear-gradient(${ANGLES[direction]}deg, ${stops.join(", ")})`;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              maskImage: gradient,
              WebkitMaskImage: gradient,
              backdropFilter: `blur(${index * blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${index * blurIntensity}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
