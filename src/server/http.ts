import { ConfigError } from "./env";
import { StorageCorruptError, StorageUnavailableError } from "./store";

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
  const tooLarge = () => ({
    ok: false as const,
    response: json({ error: "Request too large" }, 413),
  });
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > maxBytes) return tooLarge();
  let text = "";
  try {
    if (req.body) {
      // Stream the body so an oversize (e.g. chunked, no Content-Length) request is
      // aborted as soon as it crosses the cap instead of being buffered whole.
      const reader = req.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return tooLarge();
        }
        chunks.push(value);
      }
      const merged = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      text = new TextDecoder("utf-8", { fatal: false }).decode(merged);
    }
  } catch {
    return { ok: false, response: json({ error: "Invalid request body" }, 400) };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, response: json({ error: "Invalid JSON body" }, 400) };
  }
}

export function handleError(error: unknown) {
  if (error instanceof StorageUnavailableError || error instanceof StorageCorruptError)
    return json({ error: error.message }, 503);
  if (error instanceof ConfigError) {
    console.error("[config]", error.message);
    return json({ error: "Server is not configured" }, 500);
  }
  console.error("[api]", error);
  return json({ error: "Something went wrong" }, 500);
}
