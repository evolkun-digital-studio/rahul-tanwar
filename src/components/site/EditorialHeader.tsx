import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PageCmsContent } from "@/lib/cms";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { MenuButton } from "@/components/site/MenuButton";
import { MobileMenu } from "@/components/site/MobileMenu";
import { useReducedMotionPreference } from "@/lib/motion";
import { contactLinks, localHref, navLinks } from "@/lib/siteLinks";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-accent";
/* Nav link: 12px, and an underline that wipes in from the left (out to the right). */
const NAV_LINK = cn(
  "relative py-[7px] text-[12px] leading-(--text-xs--line-height) font-medium tracking-[-0.005em]",
  "after:absolute after:bottom-[2px] after:left-0 after:h-px after:w-full after:origin-right after:bg-current after:[transform:scaleX(0)] after:[transition:transform_0.42s_cubic-bezier(0.19,1,0.22,1)] after:content-['']",
  "hover:after:origin-left hover:after:[transform:scaleX(1)] focus-visible:after:origin-left focus-visible:after:[transform:scaleX(1)] motion-reduce:after:[transition:none]",
  FOCUS,
);
const NAV_CONTACT = cn(
  "group/contact inline-flex items-center gap-2 border-b border-current pb-1.5 text-[12px] leading-(--text-xs--line-height) font-medium tracking-[-0.005em]",
  FOCUS,
);

export function EditorialHeader({
  inner = false,
  content,
  darkAtTop = false,
  heroAware = false,
}: {
  inner?: boolean;
  content?: PageCmsContent;
  darkAtTop?: boolean;
  /** Home: stay out of the way while the hero (which has its own chrome) is on screen. */
  heroAware?: boolean;
}) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const reduced = useReducedMotionPreference();
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(darkAtTop);
  const [overHero, setOverHero] = useState(heroAware);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 28);
      const hero = heroAware ? document.querySelector<HTMLElement>("[data-hero]") : null;
      setOverHero(Boolean(hero && hero.getBoundingClientRect().bottom > 0));
      const sections = document.querySelectorAll<HTMLElement>("main section[data-home-tone]");
      const referenceY = window.innerWidth < 768 ? 67 : 87;
      const current = Array.from(sections).find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= referenceY && rect.bottom > referenceY;
      });
      if (sections.length) setOnDark(current?.dataset.homeTone === "dark");
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [darkAtTop, heroAware]);

  const links = navLinks(content, inner);
  const contact = contactLinks(content, inner);
  const contactHref = localHref(content?.header.ctaLink || "#contact", inner);
  const hidden = overHero;
  const tone = onDark
    ? "border-transparent bg-transparent text-chapter-text [--color-accent:var(--color-chapter-accent)]"
    : scrolled
      ? "border-hairline bg-page/92 text-ink backdrop-blur-xl"
      : "border-transparent bg-transparent text-ink";

  return (
    <>
      <header
        className={cn(
          "absolute inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,color,transform,opacity] duration-500 ease-wipe motion-reduce:[transition:none]",
          tone,
          // Home: the header always frosts its backdrop at 16px.
          "in-[.rt-home]:backdrop-blur-[16px]",
          hidden ? "pointer-events-none -translate-y-full opacity-0" : "translate-y-0 opacity-100",
        )}
        data-site-header
        inert={hidden}
      >
        <div className="mx-auto flex min-h-17 w-full max-w-[1880px] items-center justify-between gap-6 px-[var(--rt-gutter)] md:min-h-22">
          <a
            className={cn(
              "text-[15px] leading-(--text-sm--line-height) font-semibold tracking-[-0.045em] whitespace-nowrap min-[551px]:text-[16px]",
              FOCUS,
            )}
            href={inner ? "/" : "#top"}
            aria-label="Rahul Tanwar, back to home"
          >
            {content?.header.brand || "Rahul Tanwar"}.
          </a>
          <nav className="hidden items-center gap-5 md:flex lg:gap-9" aria-label="Main navigation">
            {links.map((item) => (
              <a
                className={NAV_LINK}
                key={item.href}
                href={item.href}
                onPointerEnter={() => setHoveredLink(item.href)}
                onPointerLeave={() => setHoveredLink(null)}
                onFocus={() => setHoveredLink(item.href)}
                onBlur={() => setHoveredLink(null)}
              >
                <RollingText
                  text={item.label}
                  active={hoveredLink === item.href}
                  reduced={reduced}
                />
              </a>
            ))}
            <a className={NAV_CONTACT} href={contactHref}>
              {content?.header.ctaText || "Get in touch"}{" "}
              <ArrowUpRight
                className="[transition:transform_0.42s_cubic-bezier(0.19,1,0.22,1)] group-hover/contact:[transform:translate(3px,-3px)] motion-reduce:[transition:none]"
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </a>
          </nav>
          <MenuButton className="-mr-2 focus-visible:outline-offset-[5px] md:hidden" />
        </div>
      </header>
      <MobileMenu nav={links} contact={contact} />
    </>
  );
}
