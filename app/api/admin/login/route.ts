import { z } from "zod";
import { checkCredentials, signAdminToken } from "@/server/auth";
import { getAuthConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("admin").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 10_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Invalid login details" }, 400);

    const config = getAuthConfig();
    if (!checkCredentials(parsed.data, config)) {
      return json({ error: "Invalid email or password" }, 401);
    }
    return json({ token: await signAdminToken(config.adminEmail, config.jwtSecret) });
  } catch (error) {
    return handleError(error);
  }
}
