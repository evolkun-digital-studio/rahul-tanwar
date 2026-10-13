import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * React Bits / ScrollReveal (David Haz) — https://reactbits.dev/text-animations/scroll-reveal
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/ScrollReveal
 *
 * Kept: the three scrubbed layers of the original — container rotation that
 * settles to 0°, word opacity from `baseOpacity`, and word blur.
 * Changed: no forced <h2>/<p> wrapper, no global ScrollTrigger.kill(),
 * accessible text, smaller rotation for long sentences.
 */
type ScrollRevealProps = {
  text: string;
  className?: string;
  start?: string;
  end?: string;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
};

export function ScrollReveal({
  text,
  className = "",
  start = "top 90%",
  end = "bottom 55%",
  baseOpacity = 0.12,
  baseRotation = 2,
  blurStrength = 4,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const pieces = useMemo(() => text.split(/(\s+)/).filter(Boolean), [text]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = element.querySelectorAll<HTMLElement>("[data-rb-word]");
    if (!words.length) return;
    const context = gsap.context(() => {
      if (baseRotation) {
        gsap.fromTo(
          element,
          { transformOrigin: "0% 50%", rotate: baseRotation },
          {
            rotate: 0,
            ease: "none",
            scrollTrigger: { trigger: element, start: "top bottom", end, scrub: true },
          },
        );
      }
      gsap.fromTo(
        words,
        { opacity: baseOpacity, willChange: "opacity" },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: element, start, end, scrub: true },
        },
      );
      if (blurStrength) {
        gsap.fromTo(
          words,
          { filter: `blur(${blurStrength}px)` },
          {
            filter: "blur(0px)",
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: element, start, end, scrub: true },
          },
        );
      }
    }, element);
    return () => context.revert();
  }, [text, start, end, baseOpacity, baseRotation, blurStrength]);

  return (
    <span
      ref={containerRef}
      className={`rb-scroll-reveal ${className}`}
      data-library="react-bits-scroll-reveal"
    >
      <span className="rt-visually-hidden">{text}</span>
      {pieces.map((part, index) =>
        /\s+/.test(part) ? (
          <span aria-hidden="true" key={`space-${index}`}>
            {part}
          </span>
        ) : (
          <span className="rb-reveal-word" data-rb-word aria-hidden="true" key={`${index}-${part}`}>
            {part}
          </span>
        ),
      )}
    </span>
  );
}
