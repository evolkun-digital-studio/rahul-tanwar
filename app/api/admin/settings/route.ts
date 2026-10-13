import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { handleError, isPlainObject, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return json({ settings: await getStore().readSettings() });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJsonBody(req, 100_000);
    if (!body.ok) return body.response;
    if (!isPlainObject(body.data)) return json({ error: "Settings must be an object" }, 400);
    const settings = { ...body.data, updatedAt: new Date().toISOString() };
    await getStore().writeSettings(settings);
    revalidatePath("/", "layout");
    return json({ settings });
  } catch (error) {
    return handleError(error);
  }
}
