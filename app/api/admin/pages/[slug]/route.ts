import { revalidatePath } from "next/cache";
import { isPageSlug } from "@/lib/slugs";
import { requireAdmin } from "@/server/auth";
import { handleError, isPlainObject, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug } = await ctx.params;
    const pages = await getStore().readPages();
    return json({ page: Object.hasOwn(pages, slug) ? pages[slug] : null });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug } = await ctx.params;
    if (!isPageSlug(slug)) return json({ error: "Unknown page" }, 400);
    const body = await readJsonBody(req);
    if (!body.ok) return body.response;
    if (!isPlainObject(body.data)) return json({ error: "Page content must be an object" }, 400);

    const store = getStore();
    const pages = await store.readPages({ strict: true });
    const existing = Object.hasOwn(pages, slug) ? pages[slug] : {};
    const page = { ...existing, ...body.data, slug, updatedAt: new Date().toISOString() };
    await store.writePages({ ...pages, [slug]: page });
    revalidatePath("/", "layout");
    return json({ page });
  } catch (error) {
    return handleError(error);
  }
}
