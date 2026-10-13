import { cache } from "react";
import { getDefaultContent, mergeContent, type PageCmsContent } from "@/lib/cms";
import { getStore } from "./store";

export const getPageContent = cache(async (slug: string): Promise<PageCmsContent> => {
  const defaults = getDefaultContent(slug);
  if (!defaults) throw new Error(`Unknown page slug: ${slug}`);
  try {
    const pages = await getStore().readPages();
    const page = Object.hasOwn(pages, slug) ? pages[slug] : undefined;
    return mergeContent(defaults, page as Partial<PageCmsContent> | undefined);
  } catch (error) {
    console.error(`[content] failed to load "${slug}" from storage; using defaults`, error);
    return defaults;
  }
});
