import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { BURGER_CLASS, BurgerBars } from "@/components/site/MenuButton";
import { closeMenu, menuTrigger, useMenuOpen } from "@/lib/menu";
import { getSmoothScroll } from "@/lib/motion";
import type { SiteLink } from "@/lib/siteLinks";
import { cn } from "@/lib/utils";

/* Reduced motion: the drawer and its links simply appear. */
const REDUCED = "motion-reduce:[transition-duration:0.01ms] motion-reduce:[transition-delay:0s]";

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-[11px] font-medium tracking-[0.2em] text-chapter-muted uppercase">
      {children}
    </p>
  );
}

/** The site's only mobile menu: a right-hand drawer over a blurred backdrop. */
export function MobileMenu({ nav, contact }: { nav: SiteLink[]; contact: SiteLink[] }) {
  const open = useMenuOpen();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The X lives in the drawer's layer, laid exactly over the burger that opened it, so it
  // works wherever that burger sits (the hero's chrome is inside an isolated <main>).
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [crossed, setCrossed] = useState(false);

  useEffect(() => {
    if (open) {
      const rect = menuTrigger()?.getBoundingClientRect();
      setAnchor(
        rect ? { top: rect.top, left: rect.left } : { top: 24, left: window.innerWidth - 64 },
      );
      const frame = window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => setCrossed(true)),
      );
      return () => window.cancelAnimationFrame(frame);
    }
    setCrossed(false);
    const timer = window.setTimeout(() => setAnchor(null), 600);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const panel = panelRef.current;
    const trigger = menuTrigger();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.classList.add("rt-menu-open");
    getSmoothScroll()?.stop();
    panel?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    // Focus stays in the panel (plus the X that closes it); Esc closes.
    const focusables = () =>
      [
        closeRef.current,
        ...Array.from(panel?.querySelectorAll<HTMLElement>("a[href], button") || []),
      ].filter((el): el is HTMLElement => Boolean(el));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      const index = list.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        list[list.length - 1]?.focus();
      } else if (!event.shiftKey && (index === -1 || index === list.length - 1)) {
        event.preventDefault();
        list[0]?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 640px)");
    const onDesktop = () => desktop.matches && closeMenu();
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      document.body.style.overflow = previousOverflow;
      root.classList.remove("rt-menu-open");
      getSmoothScroll()?.start();
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  // In-page anchors: close first so the scroll lock is released, then glide to the section.
  const follow = (event: MouseEvent<HTMLAnchorElement>, link: SiteLink) => {
    closeMenu();
    if (!link.href.startsWith("#") || getSmoothScroll()) return;
    event.preventDefault();
    window.requestAnimationFrame(() => {
      document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", link.href);
    });
  };

  // Staggered rise for each link; the delay is a variable so reduced motion can zero it.
  const rise = (delay: number) => ({
    className: cn(
      "transition-[transform,opacity] duration-[600ms] ease-soft [transition-delay:var(--rise-delay)]",
      open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      REDUCED,
    ),
    style: { "--rise-delay": open ? `${delay}ms` : "0ms" } as CSSProperties,
  });

  return (
    <>
      {anchor ? (
        <button
          ref={closeRef}
          type="button"
          className={cn(BURGER_CLASS, "fixed z-[60] text-chapter-text")}
          style={{ top: anchor.top, left: anchor.left }}
          aria-label="Close menu"
          aria-expanded={crossed}
          aria-controls="rt-menu-panel"
          tabIndex={open ? 0 : -1}
          onClick={closeMenu}
        >
          <BurgerBars />
        </button>
      ) : null}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-chapter/40 backdrop-blur-sm transition-opacity duration-500",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
        onClick={closeMenu}
      />
      <div
        ref={panelRef}
        id="rt-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[80%] max-w-sm flex-col overflow-y-auto bg-chapter px-8 py-10 text-chapter-text transition-transform duration-[600ms] ease-wipe",
          open ? "translate-x-0" : "translate-x-full",
          REDUCED,
        )}
      >
        <MenuLabel>Site index</MenuLabel>
        <nav className="mt-6" aria-label="Site index">
          <ul className="m-0 grid list-none gap-2 p-0">
            {nav.map((link, index) => {
              const motion = rise(300 + index * 80);
              return (
                <li key={link.href} className={motion.className} style={motion.style}>
                  <a
                    className="text-[36px] font-medium leading-[1.15] tracking-[-0.03em] transition-opacity duration-300 hover:opacity-60"
                    href={link.href}
                    onClick={(event) => follow(event, link)}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto pt-12">
          <MenuLabel>Find me</MenuLabel>
          <ul className="m-0 mt-4 grid list-none gap-1.5 p-0 text-sm">
            {contact.map((link, index) => {
              const motion = rise(550 + index * 60);
              return (
                <li key={link.label} className={motion.className} style={motion.style}>
                  <a
                    className="transition-opacity duration-300 hover:opacity-60"
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer noopener" : undefined}
                    onClick={(event) => follow(event, link)}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
