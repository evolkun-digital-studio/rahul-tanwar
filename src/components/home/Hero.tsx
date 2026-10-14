import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { MenuButton } from "@/components/site/MenuButton";
import type { PageCmsContent } from "@/lib/cms";
import { onIntroDone } from "@/lib/motion";
import { contactLinks, navLinks } from "@/lib/siteLinks";
import { cn } from "@/lib/utils";

const MARQUEE_TEXT = "Rahul Tanwar — ";

/* Entrance animations start paused (see the --animate-* tokens) and are released when the
   preloader hands over (data-intro="done"). Reduced motion finishes them instantly. */
const RELEASE =
  "group-data-[intro=done]/hero:[animation-play-state:running] motion-reduce:[animation-duration:0.01ms] motion-reduce:[animation-delay:0s] motion-reduce:[animation-play-state:running]";
const FADE_UP = cn("animate-fade-up", RELEASE);
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-chapter-accent";
const LINK = cn("[transition:opacity_0.3s] hover:opacity-60", FOCUS);
/** Stagger for one entrance, in ms (read by the --animate-fade-up token). */
const delay = (ms: number) => ({ "--anim-delay": `${ms}ms` }) as CSSProperties;

export function Hero({ content }: { content: PageCmsContent }) {
  const rootRef = useRef<HTMLElement>(null);
  const [introDone, setIntroDone] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const brand = content.header.brand || "Rahul Tanwar";
  const nav = navLinks(content);
  const contact = contactLinks(content);

  // Nothing performs until the greeting preloader hands over.
  useEffect(() => onIntroDone(() => setIntroDone(true)), []);

  // The marquee only runs while the hero is on screen and the tab is visible.
  useEffect(() => {
    const hero = rootRef.current;
    if (!hero) return;
    let intersecting = true;
    const sync = () => setOnScreen(intersecting && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      sync();
    });
    observer.observe(hero);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="group/hero relative h-screen min-h-[560px] overflow-hidden bg-chapter text-chapter-text [font-variation-settings:'opsz'_14] supports-[height:100dvh]:h-dvh"
      id="top"
      data-hero
      data-home-tone="dark"
      data-intro={introDone ? "done" : undefined}
      data-marquee={introDone && onScreen ? "running" : "paused"}
      aria-labelledby="rt-hero-title"
    >
      <h1 className="sr-only mt-0" id="rt-hero-title">
        Rahul Tanwar — Founder, Rahul Tanwar Ventures
      </h1>

      {/* 1 — the name, scrolling endlessly behind the head */}
      <div
        className={cn("absolute inset-x-0 top-[16vh] z-10 overflow-hidden sm:top-[14vh]", FADE_UP)}
        style={delay(500)}
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee whitespace-nowrap text-[14vh] leading-[0.9] font-medium tracking-[-0.045em] will-change-transform group-data-[marquee=running]/hero:[animation-play-state:running] motion-reduce:animate-none motion-reduce:[transform:none] sm:text-[26vh]">
          <span className="pr-[6vw]">{MARQUEE_TEXT}</span>
          <span className="pr-[6vw]">{MARQUEE_TEXT}</span>
        </div>
      </div>

      {/* 2 — the rule, which passes behind Rahul */}
      <div
        className={cn(
          "absolute inset-x-[var(--rt-gutter)] bottom-[5.5rem] z-10 h-px origin-left bg-[color-mix(in_srgb,var(--color-chapter-text)_70%,transparent)] sm:bottom-28",
          "animate-line",
          RELEASE,
        )}
        aria-hidden="true"
      />

      {/* 3 — the cut-out: sized by viewport height, dropped so the name sits behind the top of the head.
             Centred with `transform`; rise-in animates `translate`/`scale`, so the two never collide. */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-1/2 z-20 h-full aspect-[1086/1448] [transform:translate(-52%,13vh)] [mask-image:linear-gradient(to_right,transparent_0,var(--color-ink)_16%)] sm:[transform:translate(-49%,15vh)]",
          "animate-rise-in",
          RELEASE,
        )}
        aria-hidden="true"
      >
        <Image
          className="pointer-events-none object-cover object-[50%_0]"
          src="/images/hero/rahul-cutout.webp"
          alt=""
          fill
          preload
          fetchPriority="high"
          loading="eager"
          sizes="75vh"
        />
      </div>

      {/* 4 — lower body and chair fade into the indigo */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-25 h-[40%] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-chapter)_0%,transparent),color-mix(in_srgb,var(--color-chapter)_92%,transparent)_78%,var(--color-chapter))] sm:h-[34%]"
        aria-hidden="true"
      />

      {/* 5 — editorial chrome */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-start justify-between px-[var(--rt-gutter)] pt-6 leading-[normal] sm:pt-8">
        <a
          className={cn("text-[18px] font-medium tracking-[-0.03em]", FADE_UP, FOCUS)}
          style={delay(800)}
          href="#top"
        >
          {brand}.
        </a>
        <div className="hidden gap-[clamp(48px,6vw,96px)] text-[14px] sm:flex">
          <span className={cn("text-chapter-muted", FADE_UP)} style={delay(900)}>
            Dubai — New Delhi
          </span>
          <nav aria-label="Site">
            <ul className="grid list-none gap-0.5 p-0">
              {nav.map((link, index) => (
                <li key={link.href} className={FADE_UP} style={delay(1000 + index * 80)}>
                  <a className={LINK} href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="grid list-none gap-0.5 p-0" aria-label="Contact">
            {contact.map((link, index) => (
              <li key={link.label} className={FADE_UP} style={delay(1150 + index * 80)}>
                <a
                  className={LINK}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer noopener" : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <MenuButton
          className={cn("block text-chapter-text sm:hidden", FADE_UP, FOCUS)}
          style={delay(900)}
        />
      </header>

      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-[var(--rt-gutter)] pb-5 text-[12px] leading-[1.6] sm:pb-8 sm:text-[14px]">
        <p className={FADE_UP} style={delay(1400)}>
          Dubai-based founder
          <br />
          Gaming, beverages, apparel and textiles
          <br />
          Building across the UAE and India
        </p>
        <a className={cn("text-right", FADE_UP, FOCUS)} style={delay(1550)} href="#ventures">
          Six ventures
          <br />
          Explore <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
