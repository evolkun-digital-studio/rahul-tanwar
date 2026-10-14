import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { markIntroDone, resetIntro } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

type EditorialMotionProps = { intro?: boolean; introName?: string };

const INTRO_KEY = "rt-greeting-intro-seen-v4";
const GREETINGS = [
  { text: "Hello", language: "en" },
  { text: "नमस्ते", language: "hi", script: "devanagari" },
  { text: "مرحبا", language: "ar", script: "arabic" },
  { text: "Hola", language: "es" },
  { text: "Bonjour", language: "fr" },
  { text: "Ciao", language: "it" },
] as const;

/**
 * Page-level motion: greeting preloader, Lenis smooth scroll and the shared
 * editorial reveals (captions, hairlines, photography wipes, quote reading).
 * Section-specific choreography lives with each section component; the hero
 * waits for `markIntroDone()` which fires when the curtain lifts.
 */
export function EditorialMotion({
  intro = false,
  introName = "Rahul Tanwar",
}: EditorialMotionProps) {
  const preloaderRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fineDesktop = window.matchMedia("(min-width: 851px) and (pointer: fine)").matches;
    const preloader = preloaderRef.current;
    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    const deepLink = Boolean(window.location.hash && window.location.hash !== "#top");
    const arrivingFromTransition = document.documentElement.classList.contains("rt-page-entering");
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(INTRO_KEY) === "yes";
    } catch {
      /* Storage is optional. */
    }
    const showIntro = Boolean(
      intro &&
      preloader &&
      !reduced &&
      !deepLink &&
      !arrivingFromTransition &&
      window.scrollY < 12 &&
      (forceIntro || !seen),
    );

    let running = true;
    let unlock: (() => void) | undefined;
    if (showIntro) {
      const previousBodyOverflow = document.body.style.overflow;
      const previousRootOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.classList.add("rt-intro-running");
      unlock = () => {
        document.body.style.overflow = previousBodyOverflow;
        document.documentElement.style.overflow = previousRootOverflow;
        document.documentElement.classList.remove("rt-intro-running");
      };
    }

    let lenis: Lenis | undefined;
    let frameTick: ((time: number) => void) | undefined;
    if (fineDesktop && !reduced) {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        anchors: { offset: 0 },
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      const instance = lenis;
      instance.on("scroll", ScrollTrigger.update);
      frameTick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(frameTick);
      gsap.ticker.lagSmoothing(0);
      if (showIntro) instance.stop();
    }

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      if (preloader && !showIntro) gsap.set(preloader, { display: "none" });
      if (reduced) return;

      const all = <T extends Element = HTMLElement>(selector: string) =>
        gsap.utils.toArray<T>(selector);
      const once = (element: Element, start = "top 89%") => ({
        trigger: element,
        start,
        once: true,
      });

      all<HTMLElement>(".rt-type-mask").forEach((mask) => {
        const line = mask.querySelector<HTMLElement>("[data-type-line]");
        if (!line) return;
        gsap.fromTo(
          line,
          { yPercent: 105 },
          { yPercent: 0, duration: 1.16, ease: "power3.out", scrollTrigger: once(mask, "top 93%") },
        );
      });

      all<HTMLElement>("[data-soft-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.95,
            ease: "expo.out",
            scrollTrigger: once(element, "top 94%"),
          },
        );
      });

      all<HTMLElement>(".rt-section-caption .rt-caption-rule").forEach((rule) => {
        gsap.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 1.2, ease: "power3.inOut", scrollTrigger: once(rule, "top 94%") },
        );
      });

      all<HTMLElement>("[data-section-outro]").forEach((sectionEnd) => {
        gsap.fromTo(
          sectionEnd,
          { "--rt-outro-line": 0 },
          {
            "--rt-outro-line": 1,
            ease: "none",
            scrollTrigger: { trigger: sectionEnd, start: "top 92%", end: "top 62%", scrub: 0.65 },
          },
        );
      });

      // Photography opens directionally; the right-hand image answers the left.
      all<HTMLElement>("[data-image-reveal]").forEach((frame, index) => {
        const horizontal = frame.closest("[data-market-figure]");
        const fromClip = horizontal
          ? index % 2
            ? "inset(0% 0% 0% 100%)"
            : "inset(0% 100% 0% 0%)"
          : "inset(100% 0% 0% 0%)";
        gsap.fromTo(
          frame,
          { clipPath: fromClip },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.5,
            ease: "power4.inOut",
            scrollTrigger: once(frame, "top 85%"),
          },
        );
      });

      const quote = document.querySelector<HTMLElement>("[data-belief-quote]");
      const words = quote ? gsap.utils.toArray<HTMLElement>("[data-reading-word]", quote) : [];
      if (quote && words.length) {
        gsap.fromTo(
          words,
          { opacity: 0.12, filter: "blur(8px)", yPercent: 18 },
          {
            opacity: 1,
            filter: "blur(0px)",
            yPercent: 0,
            duration: 0.72,
            stagger: 0.025,
            ease: "power3.out",
            scrollTrigger: { trigger: quote, start: "top 96%", once: true },
          },
        );
      }

      const wordmark = document.querySelector<HTMLElement>("[data-footer-wordmark]");
      if (wordmark)
        gsap.fromTo(
          wordmark,
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1.3,
            ease: "expo.out",
            scrollTrigger: once(wordmark),
          },
        );

      mm.add("(min-width: 851px) and (prefers-reduced-motion: no-preference)", () => {
        all<HTMLImageElement>("[data-image-depth]").forEach((image) => {
          const frame = image.parentElement;
          if (!frame) return;
          gsap.fromTo(
            image,
            { yPercent: -5, scale: 1.12 },
            {
              yPercent: 5,
              scale: 1.12,
              ease: "none",
              scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 1.1 },
            },
          );
        });
      });

      if (!showIntro || !preloader) return;
      const greetings = gsap.utils.toArray<HTMLElement>(".rt-preloader-greeting", preloader);
      const corners = gsap.utils.toArray<HTMLElement>(".rt-preloader-corner", preloader);
      const opening = gsap.timeline();
      const step = 0.445;
      if (corners.length)
        opening.fromTo(corners, { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0);
      greetings.forEach((element, index) => {
        const at = index * step;
        opening.fromTo(
          element,
          { yPercent: 100, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.27, ease: "power3.out" },
          at,
        );
        opening.to(
          element,
          { yPercent: -100, autoAlpha: 0, duration: 0.19, ease: "power2.in" },
          at + 0.31,
        );
      });
      const curtainAt = GREETINGS.length * step + 0.02;
      opening.to(corners, { autoAlpha: 0, duration: 0.2 }, curtainAt - 0.22);
      opening.to(preloader, { yPercent: -120, duration: 1.06, ease: "power4.inOut" }, curtainAt);
      // Start the hero reveal before the preloader finishes lifting so the
      // name is already moving into place as the page comes into view.
      opening.call(() => markIntroDone(), [], curtainAt - 0.65);
      opening.call(
        () => {
          if (!running) return;
          gsap.set(preloader, { display: "none" });
          unlock?.();
          unlock = undefined;
          lenis?.start();
          try {
            window.sessionStorage.setItem(INTRO_KEY, "yes");
          } catch {
            /* Storage is optional. */
          }
          ScrollTrigger.refresh();
        },
        [],
        curtainAt + 1.08,
      );
    });

    // No preloader: the page is ready to perform immediately.
    if (!showIntro) markIntroDone();

    // Arriving on /#section (for example from "All ventures"): the browser's native
    // jump and Lenis's own anchor scroll are both cancelled by the ScrollTrigger
    // refreshes below, so settle on the target once layout has stopped moving.
    const rawHash = deepLink ? window.location.hash.slice(1) : "";
    let hashId = rawHash;
    try {
      hashId = decodeURIComponent(rawHash);
    } catch {
      /* Malformed escape such as "#%": fall back to the raw hash. */
    }
    const toHash = () => {
      const target = hashId ? document.getElementById(hashId) : null;
      if (!running || !target) return;
      if (lenis) lenis.scrollTo(target, { immediate: true });
      else target.scrollIntoView({ behavior: "instant" });
    };
    const refresh = () => {
      ScrollTrigger.refresh();
      toHash();
    };
    window.addEventListener("load", refresh, { once: true });
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(refresh);
    ScrollTrigger.refresh();
    return () => {
      running = false;
      window.removeEventListener("load", refresh);
      unlock?.();
      mm.revert();
      ctx.revert();
      resetIntro();
      if (lenis && frameTick) {
        gsap.ticker.remove(frameTick);
        lenis.destroy();
      }
    };
  }, [intro]);

  if (!intro) return null;
  return (
    <div className="rt-preloader" ref={preloaderRef} aria-hidden="true">
      <div className="rt-preloader-inner">
        <div className="rt-preloader-greetings">
          {GREETINGS.map((greeting) => (
            <span
              className="rt-preloader-greeting"
              key={greeting.language}
              lang={greeting.language}
              data-script={"script" in greeting ? greeting.script : undefined}
            >
              <span className="rt-preloader-dot" />
              {greeting.text}
            </span>
          ))}
        </div>
        <div className="rt-preloader-corner">
          <span>{introName}</span>
          <span>Dubai / India</span>
        </div>
      </div>
      <svg
        className="rt-preloader-curve"
        viewBox="0 0 1440 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 0 H1440 V0 C1220 105 300 105 0 0 Z" />
      </svg>
    </div>
  );
}
