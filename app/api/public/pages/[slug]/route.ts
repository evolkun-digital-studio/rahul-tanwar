import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const pages = await getStore().readPages();
    const page = Object.hasOwn(pages, slug) ? pages[slug] : null;
    return json(
      { page },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return handleError(error);
  }
}
