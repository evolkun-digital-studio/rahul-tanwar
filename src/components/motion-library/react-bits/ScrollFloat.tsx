import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * React Bits / ScrollFloat (David Haz) — https://reactbits.dev/text-animations/scroll-float
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/ScrollFloat
 *
 * Kept: per-character float scrubbed to scroll — yPercent rise with the
 * signature vertical stretch (scaleY / scaleX), `back.inOut` easing, stagger.
 * Changed: stretch reduced from 2.3 to 1.7 for long editorial headlines,
 * characters grouped inside unbreakable words, accessible text, scoped cleanup.
 */
type ScrollFloatProps = {
  text: string;
  className?: string;
  start?: string;
  end?: string;
  stagger?: number;
};

export function ScrollFloat({
  text,
  className = "",
  start = "top 92%",
  end = "bottom 62%",
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const pieces = useMemo(() => text.split(/(\s+)/).filter(Boolean), [text]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const characters = element.querySelectorAll<HTMLElement>("[data-rb-character]");
    if (!characters.length) return;
    const context = gsap.context(() => {
      gsap.fromTo(
        characters,
        {
          willChange: "opacity, transform",
          opacity: 0,
          yPercent: 115,
          scaleY: 1.7,
          scaleX: 0.82,
          transformOrigin: "50% 0%",
        },
        {
          duration: 1,
          ease: "back.inOut(2)",
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger,
          scrollTrigger: { trigger: element, start, end, scrub: 0.9, invalidateOnRefresh: true },
        },
      );
    }, element);
    return () => context.revert();
  }, [text, start, end, stagger]);

  return (
    <span
      ref={containerRef}
      className={`rb-scroll-float ${className}`}
      data-library="react-bits-scroll-float"
    >
      <span className="rt-visually-hidden">{text}</span>
      {pieces.map((piece, partIndex) =>
        /\s+/.test(piece) ? (
          <span className="rb-float-space" aria-hidden="true" key={`space-${partIndex}`}>
            {piece}
          </span>
        ) : (
          <span className="rb-float-word" aria-hidden="true" key={`${partIndex}-${piece}`}>
            {Array.from(piece).map((character, index) => (
              <span className="rb-float-char" data-rb-character key={`${index}-${character}`}>
                {character}
              </span>
            ))}
          </span>
        ),
      )}
    </span>
  );
}
