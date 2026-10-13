import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getDefaultContent, mergeContent, type PageCmsContent } from "@/lib/cms";
import { getStore } from "./store";

/**
 * Public (render-path) read of the CMS pages document.
 *
 * With Redis configured, the Upstash client fetches with `cache: "no-store"`, which makes
 * Next treat every page that reads it as dynamic (a server render plus a Redis round trip per
 * view) and silently bypasses `revalidate`. Wrapping the read in the Data Cache keeps pages
 * static/ISR: it is cached for 60s and purged on demand by the admin save routes via
 * `revalidateTag("cms")`. The read is strict so a failure throws instead of caching the seed;
 * callers handle the error. Admin read-modify-write paths never use this; they read the store
 * directly.
 */
export const getCachedPages = unstable_cache(
  async () => getStore().readPages({ strict: true }),
  ["cms-pages"],
  { revalidate: 60, tags: ["cms"] },
);

export const getPageContent = cache(async (slug: string): Promise<PageCmsContent> => {
  const defaults = getDefaultContent(slug);
  if (!defaults) throw new Error(`Unknown page slug: ${slug}`);
  try {
    const pages = await getCachedPages();
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    return mergeContent(defaults, page as Partial<PageCmsContent> | undefined);
  } catch (error) {
    console.error(`[content] failed to load "${slug}" from storage; using defaults`, error);
    return defaults;
  }
});
