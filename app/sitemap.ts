import type { MetadataRoute } from "next";
import { PAGE_SLUGS } from "@/lib/slugs";
import { getSiteUrl } from "@/server/env";
import { getStore } from "@/server/store";

export const revalidate = 3600;

const META: Record<string, { path: string; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number }> = {
  home: { path: "/", changeFrequency: "weekly", priority: 1 },
  privacy: { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  let pages: Record<string, Record<string, unknown>> = {};
  try {
    pages = await getStore().readPages();
  } catch (error) {
    console.error("[sitemap] storage unavailable, using defaults", error);
  }
  return PAGE_SLUGS.map((slug) => {
    const meta = META[slug] ?? { path: `/ventures/${slug}`, changeFrequency: "monthly" as const, priority: 0.8 };
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    const updated = typeof page?.updatedAt === "string" ? new Date(page.updatedAt) : new Date();
    return {
      url: (typeof page?.canonicalUrl === "string" && page.canonicalUrl) || `${base}${meta.path}`,
      lastModified: Number.isNaN(updated.getTime()) ? new Date() : updated,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    };
  });
}
