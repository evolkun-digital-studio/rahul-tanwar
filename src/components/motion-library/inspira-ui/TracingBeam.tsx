import { useLayoutEffect, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * Inspira UI / Tracing Beam — https://inspira-ui.com/docs/components/miscellaneous/tracing-beam
 * Source: github.com/unovue/inspira-ui › app/components/inspira/ui/tracing-beam/TracingBeam.vue
 * (Vue port of Aceternity's Tracing Beam; ported back to React here.)
 *
 * Kept: an SVG track the height of the content, a gradient whose y1 / y2 are
 * spring-driven by scroll progress (head runs ahead of the tail, so the beam
 * stretches while you scroll), and the start dot that fills once reading starts.
 * Changed: straight editorial track (no zig-zag), ink-and-gold palette, a head
 * marker that rides the beam, reduced-motion → fully drawn static line.
 */
type TracingBeamProps = { children: ReactNode; className?: string; reduced?: boolean };

export function TracingBeam({ children, className = "", reduced = false }: TracingBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const height = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 72%", "end 45%"] });
  const y1 = useSpring(
    useTransform(() => Math.min(1, scrollYProgress.get() / 0.82) * height.get()),
    { stiffness: 500, damping: 90 },
  );
  const y2 = useSpring(
    useTransform(() => Math.max(0, scrollYProgress.get() * height.get() - 220)),
    { stiffness: 500, damping: 90 },
  );
  const headY = useTransform(y1, (value) => value - 5);
  const started = useTransform(scrollYProgress, (value) => (value > 0.005 ? 1 : 0));

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const update = () => height.set(element.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [height]);

  return (
    <div
      ref={ref}
      className={`ins-tracing-beam ${reduced ? "is-static" : ""} ${className}`}
      data-library="inspira-ui-tracing-beam"
    >
      <div className="ins-beam-rail" aria-hidden="true">
        <motion.span className="ins-beam-start" style={{ opacity: reduced ? 1 : started }} />
        <svg className="ins-beam-svg" preserveAspectRatio="none">
          <line x1="1" x2="1" y1="0" y2="100%" className="ins-beam-track" />
          {!reduced ? (
            <>
              <motion.line
                x1="1"
                x2="1"
                y1="0"
                y2="100%"
                className="ins-beam-glow"
                stroke="url(#ins-beam-gradient)"
              />
              <defs>
                <motion.linearGradient
                  id="ins-beam-gradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  x2="0"
                  y1={y2}
                  y2={y1}
                >
                  <stop stopColor="var(--ins-beam-tail)" stopOpacity="0" />
                  <stop offset="0.45" stopColor="var(--ins-beam-tail)" />
                  <stop offset="1" stopColor="var(--ins-beam-head)" />
                </motion.linearGradient>
              </defs>
            </>
          ) : null}
        </svg>
        {!reduced ? <motion.span className="ins-beam-head" style={{ y: headY }} /> : null}
      </div>
      <div ref={contentRef} className="ins-beam-content">
        {children}
      </div>
    </div>
  );
}
