import { useLayoutEffect, useRef, type CSSProperties, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { onIntroDone, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText);

/**
 * React Bits / SplitText (David Haz) — https://reactbits.dev/text-animations/split-text
 * Source: github.com/DavidHDev/react-bits › src/ts-default/TextAnimations/SplitText
 *
 * Kept from the original: GSAP SplitText plugin, chars/words/lines targets,
 * from → to tween with stagger, once-only ScrollTrigger, font-ready guard.
 * Added for this site: `trigger="intro"` (waits for the greeting preloader),
 * GSAP's native line/char `mask` for clean editorial rises, a no-flash
 * pending state, accessible label handled by SplitText `aria: "auto"`,
 * and full reduced-motion bypass.
 */
type SplitType = "chars" | "words" | "lines" | "words, chars" | "lines, chars" | "lines, words";

export type SplitTextProps = {
  text: string;
  as?: ElementType;
  className?: string;
  splitType?: SplitType;
  mask?: "lines" | "words" | "chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** seconds between each split piece */
  stagger?: number | gsap.StaggerVars;
  duration?: number;
  ease?: string;
  delay?: number;
  trigger?: "scroll" | "intro" | "mount";
  start?: string;
  style?: CSSProperties;
  id?: string;
  onComplete?: () => void;
};

/** Keyed by text: GSAP replaces the text node, so new CMS copy must remount. */
export function SplitText(props: SplitTextProps) {
  return <SplitTextInner key={props.text} {...props} />;
}

function SplitTextInner({
  text,
  as: Tag = "span",
  className = "",
  splitType = "chars",
  mask,
  from = { yPercent: 110, opacity: 0 },
  to = { yPercent: 0, opacity: 1 },
  stagger = 0.028,
  duration = 1.15,
  ease = "expo.out",
  delay = 0,
  trigger = "scroll",
  start = "top 88%",
  style,
  id,
  onComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const fromKey = JSON.stringify(from);
  const toKey = JSON.stringify(to);
  const staggerKey = JSON.stringify(stagger);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reveal = () => {
      element.removeAttribute("data-split-pending");
      element.style.visibility = "visible";
    };
    if (prefersReducedMotion()) {
      reveal();
      return;
    }

    let split: GSAPSplitText | undefined;
    let tween: gsap.core.Tween | undefined;
    let cancelIntro: (() => void) | undefined;
    let alive = true;
    // Never leave copy hidden if fonts or the intro stall.
    const safety = window.setTimeout(reveal, 1400);

    const build = () => {
      if (!alive) return;
      try {
        split = new GSAPSplitText(element, {
          type: splitType,
          mask,
          aria: "auto",
          linesClass: "rb-split-line",
          wordsClass: "rb-split-word",
          charsClass: "rb-split-char",
          reduceWhiteSpace: false,
        });
        const targets: Element[] = splitType.includes("chars")
          ? split.chars
          : splitType.includes("words")
            ? split.words
            : split.lines;
        gsap.set(targets, { ...JSON.parse(fromKey) });
        reveal();
        window.clearTimeout(safety);

        const vars: gsap.TweenVars = {
          ...JSON.parse(toKey),
          duration,
          ease,
          delay,
          stagger: JSON.parse(staggerKey),
          force3D: true,
          onComplete: () => completeRef.current?.(),
        };

        if (trigger === "scroll") {
          tween = gsap.to(targets, {
            ...vars,
            scrollTrigger: { trigger: element, start, once: true },
          });
        } else if (trigger === "intro") {
          tween = gsap.to(targets, { ...vars, paused: true });
          cancelIntro = onIntroDone(() => tween?.play());
        } else {
          tween = gsap.to(targets, vars);
        }
      } catch {
        split?.revert();
        split = undefined;
        reveal();
        window.clearTimeout(safety);
      }
    };

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts && fonts.status !== "loaded") fonts.ready.then(build).catch(reveal);
    else build();

    return () => {
      alive = false;
      window.clearTimeout(safety);
      cancelIntro?.();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [text, splitType, mask, fromKey, toKey, staggerKey, duration, ease, delay, trigger, start]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn("split-text", className)}
      style={style}
      data-split-pending=""
    >
      {text}
    </Tag>
  );
}
