import { ConfigError } from "./env";
import { StorageUnavailableError } from "./store";

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function json(data: unknown, init: number | ResponseInit = 200) {
  const options = typeof init === "number" ? { status: init } : init;
  const headers = new Headers(options.headers);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...options, headers });
}

export function rateLimited(retryAfter: number) {
  return json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(
  req: Request,
  maxBytes = 1_000_000,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes)
    return { ok: false, response: json({ error: "Request too large" }, 413) };
  let text = "";
  try {
    text = await req.text();
  } catch {
    return { ok: false, response: json({ error: "Invalid request body" }, 400) };
  }
  if (text.length > maxBytes)
    return { ok: false, response: json({ error: "Request too large" }, 413) };
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, response: json({ error: "Invalid JSON body" }, 400) };
  }
}

export function handleError(error: unknown) {
  if (error instanceof StorageUnavailableError) return json({ error: error.message }, 503);
  if (error instanceof ConfigError) {
    console.error("[config]", error.message);
    return json({ error: "Server is not configured" }, 500);
  }
  console.error("[api]", error);
  return json({ error: "Something went wrong" }, 500);
}
