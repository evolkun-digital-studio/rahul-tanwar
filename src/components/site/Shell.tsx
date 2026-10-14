import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** The homepage's 1680px content column with its responsive side padding. */
export const SHELL =
  "mx-auto w-[min(100%,1680px)] px-[18px] min-[361px]:px-[22px] min-[621px]:px-[clamp(24px,5.2vw,90px)]";

export function Shell({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(SHELL, className)} {...props} />;
}

/** Visually hidden but read by assistive tech (same box as the old .rt-visually-hidden). */
export const VISUALLY_HIDDEN =
  "absolute h-px w-px overflow-hidden border-0 border-none border-current p-0 -m-px whitespace-nowrap [clip:rect(0,0,0,0)]";
