import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { PageCmsContent } from "@/lib/cms";

export function Header({ content }: { content: PageCmsContent }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = content.header.links || [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl bg-background/70 border-b border-line" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-12">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-display text-[22px] tracking-normal text-ink">
            {content.header.brand}
          </span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-gold md:block" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="group relative text-[13px] font-medium text-ink/80 transition hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={content.header.ctaLink}
            className="hidden rounded-full border border-ink/15 bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.18em] text-paper transition hover:bg-gold hover:text-ink md:inline-flex"
          >
            {content.header.ctaText}
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-background/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-[22px] text-ink"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={content.header.ctaLink}
                onClick={() => setOpen(false)}
                className="mt-4 inline-flex w-fit rounded-full bg-ink px-5 py-3 text-[12px] uppercase tracking-[0.18em] text-paper"
              >
                {content.header.ctaText}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
