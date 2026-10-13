import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { VENTURE_SLUGS } from "@/lib/slugs";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { VentureView } from "@/views/VentureView";

export const revalidate = 60;
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VENTURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!(VENTURE_SLUGS as readonly string[]).includes(slug)) return {};
  return buildMetadata(await getPageContent(slug));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!(VENTURE_SLUGS as readonly string[]).includes(slug)) notFound();
  const content = await getPageContent(slug);
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <VentureView slug={slug} content={content} />
    </>
  );
}
