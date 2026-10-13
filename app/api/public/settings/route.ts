import { handleError, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return json({ settings: await getStore().readSettings() });
  } catch (error) {
    return handleError(error);
  }
}
