import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin } from "@/server/auth";
import { handleError, json, readJsonBody } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().trim().url(),
  altText: z.string().trim().max(300).optional().default(""),
  title: z.string().trim().max(160).optional().default(""),
  usageLocation: z.string().trim().max(160).optional().default(""),
});

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    return json({ assets: await getStore().readMedia() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const body = await readJsonBody(req, 50_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Valid image URL is required" }, 400);

    const store = getStore();
    const media = await store.readMedia({ strict: true });
    const asset = {
      id: randomUUID(),
      url: parsed.data.url,
      altText: parsed.data.altText,
      title: parsed.data.title || parsed.data.url,
      usageLocation: parsed.data.usageLocation,
      createdAt: new Date().toISOString(),
    };
    await store.writeMedia([asset, ...media]);
    return json({ asset }, 201);
  } catch (error) {
    return handleError(error);
  }
}
