"use client";

import { EditorialHeader } from "@/components/site/EditorialHeader";
import { EditorialFooter } from "@/components/site/EditorialFooter";
import type { PageCmsContent } from "@/lib/cms";

type PrivacySection = {
  eyebrow: string;
  title: string;
  intro: string;
  updatedLabel: string;
  updatedAt: string;
  blocks: Array<{ title: string; body: string }>;
};

export function PrivacyView({ content }: { content: PageCmsContent }) {
  const privacy = content.sections.privacy as PrivacySection;
  return (
    <div className="min-h-svh bg-[#f9f8f5] text-[#141715]" id="top">
      <EditorialHeader inner content={content} />
      <main className="mx-auto w-full max-w-[1180px] px-6 pb-28 pt-32 md:px-[clamp(24px,5.15vw,94px)] md:pb-40 md:pt-44">
        <a className="inline-flex border-b border-current pb-2 text-sm" href="/">
          ← Back to home
        </a>
        <p className="mt-20 text-xs font-semibold uppercase tracking-[0.135em] text-[#696f69]">
          Our policies
        </p>
        <h1 className="mt-6 text-[clamp(3.5rem,7vw,6.5rem)] font-medium leading-none tracking-[-0.06em]">
          {privacy.title}
        </h1>
        <p className="mt-7 text-xs text-[#777b76]">
          {privacy.updatedLabel}: {privacy.updatedAt}
        </p>
        <p className="mt-16 max-w-3xl text-[clamp(1.25rem,2.5vw,2rem)] leading-snug tracking-[-0.03em]">
          {privacy.intro}
        </p>
        <div className="my-20">
          {privacy.blocks.map((block) => (
            <section
              className="grid gap-4 border-t border-[#dcded7] py-8 md:grid-cols-[1fr_1.2fr] md:gap-16"
              key={block.title}
            >
              <h2 className="text-[clamp(1.35rem,2.6vw,2rem)] font-medium tracking-[-0.04em]">
                {block.title}
              </h2>
              <p className="text-[15px] leading-[1.9] text-[#707570]">{block.body}</p>
            </section>
          ))}
        </div>
        <a
          className="inline-flex border-b border-current pb-2 text-sm font-semibold"
          href={`mailto:${content.contactEmail}`}
        >
          Questions? Contact us ↗
        </a>
      </main>
      <EditorialFooter inner content={content} />
    </div>
  );
}
