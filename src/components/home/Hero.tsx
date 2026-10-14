import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SplitText } from "@/components/motion-library/react-bits/SplitText";
import { RotatingText } from "@/components/motion-library/react-bits/RotatingText";
import { CircularText } from "@/components/motion-library/react-bits/CircularText";
import { GridDistortion } from "@/components/motion-library/react-bits/GridDistortion";
import { Magnetic } from "@/components/motion-library/animate-ui/Magnetic";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { TextGenerateEffect } from "@/components/motion-library/inspira-ui/TextGenerateEffect";
import { ProgressiveBlur } from "@/components/motion-library/motion-primitives/ProgressiveBlur";
import { IMG, VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";
import { onIntroDone, useIntroDone, useMediaQuery, useReducedMotionPreference } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/* One word per venture, in portfolio order. Unknown CMS ventures fall back to their industry. */
const ROTATOR_WORDS: Record<string, string> = {
  sr18: "gaming",
  delhi6: "craft beer",
  volt50000: "functional drinks",
  masai: "brewing",
  adatto: "athleisure",
  arnika: "textiles",
};

type HeroCopy = {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
};

export function Hero({ content }: { content: PageCmsContent }) {
  const rootRef = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  const reduced = useReducedMotionPreference();
  const fineDesktop = useMediaQuery("(min-width: 851px) and (pointer: fine)");
  const [ctaHover, setCtaHover] = useState(false);
  const [rotate, setRotate] = useState(false);

  const hero = content.sections.hero as HeroCopy;
  const photo = content.images.founder?.url || IMG.founder;
  const photoAlt = content.images.founder?.alt || "Rahul Tanwar, entrepreneur and founder";
  const photoTitle = content.images.founder?.title || "Rahul Tanwar | Founder & Entrepreneur";
  const heading = (hero.heading || content.header.brand || "Rahul Tanwar").trim();
  const ecosystem = content.sections.ecosystem as { ventures?: typeof VENTURES } | undefined;
  const rotator = (ecosystem?.ventures?.length ? ecosystem.ventures : VENTURES).map(
    (venture) => ROTATOR_WORDS[venture.id] || venture.industry.toLowerCase(),
  );

  // Intro + scroll choreography owned by the hero itself (GSAP).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const frame = root.querySelector<HTMLElement>("[data-hero-frame]");
    const parallax = root.querySelector<HTMLElement>("[data-hero-parallax]");
    const copy = root.querySelector<HTMLElement>("[data-hero-copy]");
    const fades = root.querySelectorAll<HTMLElement>("[data-hero-fade]");
    const badge = root.querySelector<HTMLElement>("[data-hero-badge]");
    const rule = root.querySelector<HTMLElement>("[data-hero-rule]");

    const ctx = gsap.context(() => {
      gsap.set(frame, { clipPath: "inset(100% 0% 0% 0%)" });
      gsap.set(parallax, { scale: 1.32 });
      gsap.set(fades, { autoAlpha: 0, y: 22 });
      gsap.set(badge, { autoAlpha: 0, scale: 0.6, rotate: -120 });
      gsap.set(rule, { scaleX: 0 });

      const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
      intro
        .to(frame, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.45, ease: "power4.inOut" }, 0)
        .to(parallax, { scale: 1.12, duration: 2.2 }, 0.05)
        .to(rule, { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0.35)
        .to(fades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.09 }, 0.62)
        .to(badge, { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.4 }, 0.95)
        .call(() => setRotate(true), [], 1.9);

      const stop = onIntroDone(() => intro.play());

      // Reading begins: the portrait sinks back and the copy lifts away.
      gsap.to(frame, {
        yPercent: 7,
        scale: 0.94,
        transformOrigin: "50% 0%",
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.9 },
      });
      gsap.to(parallax, {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.9 },
      });
      gsap.to(copy, {
        y: -60,
        autoAlpha: 0.15,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom 15%", scrub: 0.9 },
      });
      return () => stop();
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className="rt-hero6"
      id="top"
      data-home-tone="light"
      aria-labelledby="hero-heading"
    >
      <div className="rt-hero6-grid">
        <div className="rt-hero6-copy" data-hero-copy>
          <div className="rt-hero6-meta" data-hero-fade>
            {/* <span className="rt-hero6-status" aria-hidden="true" /> */}
            {/* <span>{hero.eyebrow || "Founder & entrepreneur"}</span>
            <span className="rt-hero6-meta-aside">UAE — India</span> */}
          </div>

          <div className="rt-hero6-body">
            <h1 className="rt-hero6-title" id="hero-heading" aria-label={heading}>
              <SplitText
                text={heading}
                className="rt-hero6-line"
                splitType="lines, chars"
                mask="lines"
                trigger="intro"
                from={{ yPercent: 118, rotate: 6 }}
                to={{ yPercent: 0, rotate: 0 }}
                stagger={0.045}
                duration={1.35}
                delay={0.28}
              />
            </h1>

            <p className="rt-hero6-rotator" data-hero-fade>
              <span className="rt-hero6-rotator-lead">Ventures in</span>
              <RotatingText
                texts={rotator}
                className="rt-hero6-pill "
                paused={!rotate}
                reduced={reduced}
                staggerFrom="last"
                rotationInterval={2600}
              />
            </p>

            <TextGenerateEffect
              className="rt-hero6-summary"
              words={
                hero.subheading ||
                "Building ventures across gaming, beverages, apparel and manufacturing in the UAE and India."
              }
              play={introDone}
              delay={0.9}
              stagger={0.045}
              reduced={reduced}
            />
          </div>

          <div className="rt-hero6-actions" data-hero-fade>
            <Magnetic strength={0.22} max={10}>
              <a
                className="rt-hero6-cta"
                href={hero.ctaLink || "#ventures"}
                onPointerEnter={() => setCtaHover(true)}
                onPointerLeave={() => setCtaHover(false)}
                onFocus={() => setCtaHover(true)}
                onBlur={() => setCtaHover(false)}
              >
                <RollingText
                  text={hero.ctaText || "Explore the ventures"}
                  active={ctaHover}
                  reduced={reduced}
                />
                <span className="rt-hero6-cta-icon" aria-hidden="true">
                  <ArrowUpRight size={18} strokeWidth={1.6} />
                </span>
              </a>
            </Magnetic>
            {/* <span className="rt-hero6-index" aria-hidden="true">
              {String(rotator.length).padStart(2, "0")} ventures · 02 markets
            </span> */}
          </div>
        </div>

        <div className="rt-hero6-media">
          <div className="rt-hero6-frame" data-hero-frame>
            <div className="rt-hero6-parallax" data-hero-parallax>
              <GridDistortion
                className="rt-hero6-image"
                imageSrc={photo}
                alt={photoAlt}
                title={photoTitle}
                priority
                enabled={fineDesktop && !reduced}
                strength={0.13}
                softness={0.86}
                maxShift={0.03}
              />
            </div>
            <ProgressiveBlur
              className="rt-hero6-blur"
              direction="bottom"
              blurLayers={6}
              blurIntensity={0.7}
            />
            <div className="rt-hero6-caption" data-hero-fade aria-hidden="true">
              <span>Rahul Tanwar</span>
              <span>Founder, Rahul Tanwar Ventures</span>
            </div>
          </div>
          <a
            className="rt-hero6-scroll"
            href="#introduction"
            aria-label="Scroll to explore"
            data-hero-badge
          >
            <CircularText
              text="SCROLL · TO · EXPLORE · SCROLL · TO · EXPLORE · "
              spinDuration={22}
              reduced={reduced}
            >
              <ArrowDown size={18} strokeWidth={1.4} />
            </CircularText>
          </a>
        </div>
      </div>
    </section>
  );
}
