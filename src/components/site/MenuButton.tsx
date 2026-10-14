import type { CSSProperties } from "react";
import { toggleMenu, useMenuOpen } from "@/lib/menu";
import { cn } from "@/lib/utils";

/** The 40×40 burger shell. Bars turn into an X when the button's aria-expanded is true. */
export const BURGER_CLASS =
  "group/burger relative size-10 flex-none cursor-pointer border-0 border-none border-current bg-transparent p-0 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const BAR =
  "absolute left-2 h-[1.5px] w-6 bg-current [transition:transform_0.5s_var(--ease-wipe),opacity_0.3s_ease] motion-reduce:[transition-duration:0.01ms] motion-reduce:[transition-delay:0s]";

/** Three bars: 24×1.5px at 12 / 19 / 26px; the outer pair rotates ±45°, the middle one fades. */
export function BurgerBars() {
  return (
    <>
      <i
        className={cn(
          BAR,
          "top-3 group-aria-expanded/burger:[transform:translateY(7px)_rotate(45deg)]",
        )}
      />
      <i className={cn(BAR, "top-[19px] group-aria-expanded/burger:opacity-0")} />
      <i
        className={cn(
          BAR,
          "top-[26px] group-aria-expanded/burger:[transform:translateY(-7px)_rotate(-45deg)]",
        )}
      />
    </>
  );
}

/** Opens the site's single mobile menu. */
export function MenuButton({ className, style }: { className?: string; style?: CSSProperties }) {
  const open = useMenuOpen();
  return (
    <button
      type="button"
      className={cn(BURGER_CLASS, className)}
      style={style}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      aria-controls="rt-menu-panel"
      data-menu-trigger
      onClick={(event) => toggleMenu(event.currentTarget)}
    >
      <BurgerBars />
    </button>
  );
}
