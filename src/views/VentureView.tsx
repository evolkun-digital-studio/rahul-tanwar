"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { EditorialHeader } from "@/components/site/EditorialHeader";
import { EditorialFooter } from "@/components/site/EditorialFooter";
import { EditorialMotion } from "@/components/site/EditorialMotion";
import { EditorialVisual, toEditorialVenture } from "@/components/site/EditorialVisual";
import { VENTURES } from "@/lib/data";
import type { PageCmsContent } from "@/lib/cms";

const detailFallback: Record<
  string,
  { title: string; description: string; focusTitle: string; highlights: string[] }
> = {
  "volt-50000": {
    title: "A functional beverage for the pace of the Gulf.",
    description:
      "Volt 50000 is a premium functional beverage conceived for high-performance lifestyles in the UAE and wider GCC region.",
    focusTitle: "Performance with purpose.",
    highlights: [
      "Premium functional beverage",
      "Designed for performance-led lifestyles",
      "Focused on the UAE and Gulf markets",
    ],
  },
  "arnika-textiles": {
    title: "Closer to the making. Closer to quality.",
    description:
      "Arnika Textiles is an India-based, vertically integrated textile manufacturing venture focused on quality fabrics and end-to-end supply-chain control.",
    focusTitle: "From fibre to finished fabric.",
    highlights: [
      "Vertically integrated textile manufacturing",
      "Focus on quality and precision",
      "Built around supply-chain control",
    ],
  },
};

type DetailContent = {
  eyebrow?: string;
  title: string;
  description: string;
  region?: string;
  category?: string;
  year?: string;
  imageKey?: string;
  focusTitle: string;
  highlights: string[];
};

export function VentureView({ slug, content }: { slug: string; content: PageCmsContent }) {
  const ventures = VENTURES.map(toEditorialVenture);
  const index = ventures.findIndex((item) => item.slug === slug);
  const venture = ventures[index];
  const next = ventures[(index + 1) % ventures.length];
  const cms = content.sections.venturePage as DetailContent | undefined;
  const detail: DetailContent | undefined = cms || detailFallback[slug];

  if (!venture || !detail)
    return (
      <div className="mx-auto min-h-svh w-full max-w-[1680px] bg-[#f9f8f5] px-6 pt-44 text-[#141715] md:px-[clamp(24px,5.15vw,94px)]">
        <h1>Venture not found</h1>
        <a href="/#ventures">Return to ventures</a>
      </div>
    );

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#f9f8f5] text-[#141715]" id="top">
      <EditorialMotion />
      <EditorialHeader inner content={content} />
      <main>
        <section className="mx-auto w-full max-w-[1680px] px-6 pb-12 pt-36 md:px-[clamp(24px,5.15vw,94px)] md:pt-48">
          <a
            className="inline-flex items-center gap-3 border-b border-current pb-2 text-sm"
            href="/#ventures"
          >
            <ArrowLeft size={16} strokeWidth={1.35} /> All ventures
          </a>
          <div className="mt-[clamp(4rem,8vw,8rem)] grid items-end gap-10 md:grid-cols-[1.2fr_.65fr] md:gap-20">
            <h1 className="rt-detail-title max-w-4xl text-[clamp(3.5rem,8vw,8rem)] font-medium leading-[.95] tracking-[-0.07em]">
              {venture.name}
            </h1>
            <p className="pb-2 text-[clamp(1.4rem,2.4vw,2.5rem)] leading-tight tracking-[-0.03em]">
              {venture.phrase}
            </p>
          </div>
          <div className="mt-[clamp(3rem,7vw,7rem)] h-[clamp(28rem,56vw,52rem)]" data-reveal>
            <EditorialVisual
              venture={venture}
              content={content}
              parallax={venture.visual === "photo"}
            />
          </div>
          <div
            className="flex flex-col gap-8 border-b border-[#dcded7] py-6 md:flex-row md:items-start md:justify-between md:gap-12 md:pb-12"
            data-reveal
          >
            <p className="text-xs text-[#777b76]">
              An independent venture within the Rahul Tanwar portfolio.
            </p>
            <dl className="flex flex-wrap gap-10 md:gap-20">
              <div>
                <dt className="mb-2 text-xs text-[#7a8078]">Focus</dt>
                <dd className="m-0 text-sm">{detail.category || venture.industry}</dd>
              </div>
              <div>
                <dt className="mb-2 text-xs text-[#7a8078]">Market</dt>
                <dd className="m-0 text-sm">{detail.region || venture.country}</dd>
              </div>
              <div>
                <dt className="mb-2 text-xs text-[#7a8078]">Established</dt>
                <dd className="m-0 text-sm">{detail.year || venture.year}</dd>
              </div>
            </dl>
          </div>
        </section>
        <section className="mx-auto grid w-full max-w-[1680px] gap-12 px-6 py-[clamp(7rem,13vw,13rem)] md:grid-cols-[.8fr_1.2fr] md:gap-[clamp(4rem,10vw,10rem)] md:px-[clamp(24px,5.15vw,94px)]">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.135em] text-[#696f69]">
              Behind the venture
            </p>
            <h2 className="mt-8 text-[clamp(2.5rem,4.8vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.05em]">
              {detail.focusTitle.includes(" ") ? (
                <>
                  {detail.focusTitle.split(" ").slice(0, -2).join(" ")}
                  <br />
                  <span>{detail.focusTitle.split(" ").slice(-2).join(" ")}</span>
                </>
              ) : (
                detail.focusTitle
              )}
            </h2>
          </div>
          <div className="pt-4" data-reveal>
            <p className="max-w-2xl text-[clamp(1.2rem,2vw,1.8rem)] leading-normal tracking-[-0.025em]">
              {detail.description}
            </p>
            <ul className="mt-16 border-t border-[#dcded7] p-0">
              {detail.highlights.map((highlight) => (
                <li
                  className="flex list-none items-baseline justify-between gap-8 border-b border-[#dcded7] py-5 text-[15px] after:content-['↗'] after:text-lg after:text-[#a8aea5]"
                  key={highlight}
                >
                  {highlight}
                </li>
              ))}
            </ul>
            <a
              className="mt-14 inline-flex items-center gap-12 border-b border-current pb-2 text-sm font-semibold"
              href="/#contact"
            >
              Discuss a partnership <ArrowUpRight size={18} strokeWidth={1.4} />
            </a>
          </div>
        </section>
        <section className="bg-[#e8eae4] py-[clamp(5rem,9vw,9rem)]">
          <div className="mx-auto w-full max-w-[1680px] px-6 md:px-[clamp(24px,5.15vw,94px)]">
            <a
              className="flex items-end justify-between gap-10"
              href={`/ventures/${next.slug}`}
              aria-label={`Next venture: ${next.name}`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.135em] text-[#696f69]">
                  Discover another venture
                </p>
                <h2 className="mt-6 text-[clamp(2.5rem,7vw,7rem)] font-medium leading-none tracking-[-0.06em]">
                  {next.name}
                </h2>
              </div>
              <div className="grid size-14 shrink-0 place-items-center border border-[#acb3a9] md:size-20">
                <ArrowUpRight size={26} strokeWidth={1.2} />
              </div>
            </a>
          </div>
        </section>
      </main>
      <EditorialFooter inner content={content} />
    </div>
  );
}
