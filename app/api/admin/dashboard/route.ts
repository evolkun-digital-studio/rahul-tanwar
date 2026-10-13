import { requireAdmin } from "@/server/auth";
import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const store = getStore();
    const [media, pages] = await Promise.all([store.readMedia(), store.readPages()]);
    return json({ stats: { leads: 0, media: media.length, pages: Object.keys(pages).length } });
  } catch (error) {
    return handleError(error);
  }
}
