import { Fragment, useEffect, useRef, useState, type ElementType } from "react";

/**
 * Inspira UI / Text Generate Effect — https://inspira-ui.com/docs/components/text-animations/text-generate-effect
 * Source: github.com/unovue/inspira-ui › app/components/inspira/ui/text-generate-effect
 *
 * Kept: words start at opacity 0 + blur(10px) and resolve one after another
 * through CSS transitions (cheap — no animation loop per word).
 * Changed: `play` prop (hero waits for the preloader), in-view fallback,
 * stagger tightened from 200ms to ~60ms for paragraph-length copy.
 */
type TextGenerateEffectProps = {
  words: string;
  as?: ElementType;
  className?: string;
  play?: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  reduced?: boolean;
};

export function TextGenerateEffect({
  words,
  as: Tag = "p",
  className = "",
  play,
  delay = 0,
  stagger = 0.06,
  duration = 0.7,
  reduced = false,
}: TextGenerateEffectProps) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (play !== undefined || reduced) return;
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [play, reduced]);

  const active = reduced || (play ?? seen);
  const list = words.split(" ");
  return (
    <Tag
      ref={ref}
      className={`ins-text-generate ${active ? "is-generated" : ""} ${className}`}
      data-library="inspira-ui-text-generate-effect"
    >
      <span className="rt-visually-hidden">{words}</span>
      {list.map((word, index) => (
        <Fragment key={`${index}-${word}`}>
          <span
            aria-hidden="true"
            className="ins-generate-word"
            style={{
              transitionDuration: `${duration}s`,
              transitionDelay: `${delay + index * stagger}s`,
            }}
          >
            {word}
          </span>
          {index < list.length - 1 ? <span aria-hidden="true"> </span> : null}
        </Fragment>
      ))}
    </Tag>
  );
}
