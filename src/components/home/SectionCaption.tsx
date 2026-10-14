import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The small caption row that opens a section: an eyebrow on the left and an optional
 * aside on the right. Fades up on scroll via EditorialMotion's [data-soft-reveal].
 */
export function SectionCaption({
  eyebrow,
  aside,
  className,
}: {
  eyebrow: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[19px] items-baseline gap-4 text-[12px] text-body will-change-[transform,opacity] min-[621px]:items-center min-[621px]:gap-[clamp(18px,2.8vw,46px)] motion-reduce:will-change-auto",
        className,
      )}
      data-soft-reveal
    >
      <span className="text-[11px] leading-[1.5] font-medium tracking-[0.015em] whitespace-normal normal-case min-[621px]:text-[clamp(11px,0.87vw,12px)]">
        {eyebrow}
      </span>
      {aside ? (
        <span className="ml-auto text-[10px] whitespace-nowrap min-[621px]:text-[12px]">
          {aside}
        </span>
      ) : null}
    </div>
  );
}
