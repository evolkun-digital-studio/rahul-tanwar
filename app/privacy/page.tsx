import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { PrivacyView } from "@/views/PrivacyView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageContent("privacy"));
}

export default async function Page() {
  const content = await getPageContent("privacy");
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <PrivacyView content={content} />
    </>
  );
}
