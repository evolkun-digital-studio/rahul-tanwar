import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { PageCmsContent } from "@/lib/cms";
import { RollingText } from "@/components/motion-library/animate-ui/RollingText";
import { useReducedMotionPreference } from "@/lib/motion";

const NAV = [
  { label: "Ventures", id: "ventures" },
  { label: "Philosophy", id: "philosophy" },
  { label: "About", id: "about" },
];

export function EditorialHeader({
  inner = false,
  content,
  darkAtTop = false,
}: {
  inner?: boolean;
  content?: PageCmsContent;
  darkAtTop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const reduced = useReducedMotionPreference();
  const [scrolled, setScrolled] = useState(false);
  const [onDark, setOnDark] = useState(darkAtTop);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 28);
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
  }, [darkAtTop]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const anchor = (id: string) => `${inner ? "/" : ""}#${id}`;
  const links = content?.header.links?.length
    ? content.header.links
        .filter((item) => item.href !== "#contact" && item.href !== "/#contact")
        .slice(0, 4)
    : NAV.map((item) => ({ label: item.label, href: `#${item.id}` }));
  const localHref = (href: string) => (inner && href.startsWith("#") ? `/${href}` : href);
  const inverse = onDark && !open;
  const contactHref = content?.header.ctaLink
    ? localHref(content.header.ctaLink)
    : anchor("contact");

  return (
    <header
      className={`rt-site-header fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,color] duration-500 ${inverse ? "border-transparent bg-transparent text-[#f3f1ea]" : scrolled || open ? "border-[#e2e4db] bg-[#f4f1eb]/94 text-[#181b19] backdrop-blur-xl" : "border-transparent bg-transparent text-[#181b19]"}`}
    >
      <div className="mx-auto flex min-h-17 w-full max-w-[1680px] items-center justify-between gap-6 px-6 md:min-h-22 md:px-[clamp(24px,5.15vw,94px)]">
        <a
          className="whitespace-nowrap text-sm font-semibold tracking-[-0.035em]"
          href={inner ? "/" : "#top"}
          aria-label="Rahul Tanwar, back to home"
          onClick={() => setOpen(false)}
        >
          {content?.header.brand || "Rahul Tanwar"}.
        </a>
        <nav className="hidden items-center gap-5 md:flex lg:gap-9" aria-label="Main navigation">
          {links.map((item) => (
            <a
              className="rt-nav-link text-xs font-medium"
              key={item.href}
              href={localHref(item.href)}
              onPointerEnter={() => setHoveredLink(item.href)}
              onPointerLeave={() => setHoveredLink(null)}
              onFocus={() => setHoveredLink(item.href)}
              onBlur={() => setHoveredLink(null)}
            >
              <RollingText text={item.label} active={hoveredLink === item.href} reduced={reduced} />
            </a>
          ))}
          <a
            className="rt-nav-contact inline-flex items-center gap-2 border-b border-current pb-1.5 text-xs font-medium"
            href={contactHref}
          >
            {content?.header.ctaText || "Get in touch"}{" "}
            <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </nav>
        <button
          type="button"
          className="relative z-10 flex size-11 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="rt-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px w-6 bg-current transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-current transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>
      <div
        className={`overflow-hidden bg-[#f9f8f5] transition-[height] duration-500 md:hidden ${open ? "h-[min(480px,calc(100svh-68px))]" : "h-0"}`}
        id="rt-mobile-menu"
        inert={!open}
      >
        <nav className="flex flex-col gap-3 px-6 py-8" aria-label="Mobile navigation">
          {links.map((item) => (
            <a
              className="flex justify-between text-[clamp(2rem,9vw,4rem)] leading-tight tracking-[-0.06em]"
              onClick={() => setOpen(false)}
              href={localHref(item.href)}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
          <a
            className="flex justify-between text-[clamp(2rem,9vw,4rem)] leading-tight tracking-[-0.06em]"
            onClick={() => setOpen(false)}
            href={contactHref}
          >
            {content?.header.ctaText || "Get in touch"} <ArrowUpRight size={24} strokeWidth={1.3} />
          </a>
        </nav>
        <p className="mt-5 px-6 text-xs text-[#777b76]">Dubai, UAE &nbsp; / &nbsp; India</p>
      </div>
    </header>
  );
}
