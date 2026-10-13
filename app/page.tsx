import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { getPageContent } from "@/server/content";
import { buildJsonLd, buildMetadata } from "@/server/seo";
import { HomeView } from "@/views/HomeView";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getPageContent("home"));
}

export default async function Page() {
  const content = await getPageContent("home");
  return (
    <>
      <JsonLd data={buildJsonLd(content)} />
      <HomeView content={content} />
    </>
  );
}
