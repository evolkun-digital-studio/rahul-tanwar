import { ArrowUpRight } from "lucide-react";
import type { PageCmsContent } from "@/lib/cms";

export function EditorialFooter({
  inner = false,
  content,
}: {
  inner?: boolean;
  content?: PageCmsContent;
}) {
  const footer = content?.sections.footer as { tagline?: string; region?: string } | undefined;
  return (
    <footer className="bg-surface pb-6 pt-14 md:pt-20">
      <div className="mx-auto w-full max-w-[1680px] px-6 md:px-[clamp(24px,5.15vw,94px)]">
        <div className="flex justify-between gap-6 text-xs text-body">
          <span>{footer?.tagline || "Independent thinking. Lasting businesses."}</span>
          <a
            className="inline-flex items-center gap-3 text-ink"
            href={inner ? "/" : "#top"}
            aria-label="Back to top"
          >
            Back to top <ArrowUpRight size={17} strokeWidth={1.4} />
          </a>
        </div>
        <a
          className="block whitespace-nowrap py-[clamp(4rem,8vw,7.5rem)] text-[clamp(3.75rem,10.5vw,10.5rem)] font-medium leading-none tracking-[-0.08em]"
          href={inner ? "/" : "#top"}
          data-footer-wordmark={inner ? undefined : ""}
        >
          Rahul Tanwar.
        </a>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5 text-xs text-body">
          <span>© {new Date().getFullYear()} Rahul Tanwar</span>
          <span>{footer?.region || "Dubai, UAE / India"}</span>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
