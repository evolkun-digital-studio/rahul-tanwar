import { describe, expect, it } from "vitest";
import { ConfigError } from "./env";
import { SLUG_RE, handleError, isPlainObject, readJsonBody } from "./http";
import { StorageCorruptError, StorageUnavailableError } from "./store";

const post = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body, headers });

describe("readJsonBody", () => {
  it("parses valid JSON", async () => {
    const r = await readJsonBody(post(JSON.stringify({ a: 1 })));
    expect(r).toEqual({ ok: true, data: { a: 1 } });
  });
  it("returns 400 for malformed JSON", async () => {
    const r = await readJsonBody(post("{oops"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
  it("returns 400 for an empty body", async () => {
    const r = await readJsonBody(post(""));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
  it("returns 413 when content-length exceeds the cap", async () => {
    const r = await readJsonBody(post("{}", { "content-length": "5000000" }), 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });
  it("returns 413 when the actual body exceeds the cap", async () => {
    const r = await readJsonBody(post(JSON.stringify({ a: "x".repeat(2000) })), 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });
});

describe("readJsonBody streaming", () => {
  const streamed = (chunks: Uint8Array[], onCancel?: () => void) => {
    let i = 0;
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i >= chunks.length) return controller.close();
        pulled += 1;
        controller.enqueue(chunks[i++]);
      },
      cancel() {
        onCancel?.();
      },
    });
    const req = new Request("http://x/api", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit);
    return { req, pulled: () => pulled };
  };
  const enc = new TextEncoder();

  it("returns 413 for an oversize chunked body without reading it all", async () => {
    let cancelled = false;
    const chunks = Array.from({ length: 1000 }, () => enc.encode("x".repeat(100)));
    const { req, pulled } = streamed(chunks, () => {
      cancelled = true;
    });
    expect(req.headers.get("content-length")).toBeNull();
    const r = await readJsonBody(req, 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(pulled()).toBeLessThan(100);
  });
  it("measures the body in bytes, not UTF-16 characters", async () => {
    const r = await readJsonBody(post(JSON.stringify({ a: "€".repeat(400) })), 1000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });
  it("reassembles a multibyte character split across chunks", async () => {
    const bytes = enc.encode(JSON.stringify({ a: "€" }));
    const mid = bytes.indexOf(0xe2) + 1;
    const { req } = streamed([bytes.slice(0, mid), bytes.slice(mid)]);
    expect(await readJsonBody(req, 1000)).toEqual({ ok: true, data: { a: "€" } });
  });
});

describe("helpers", () => {
  it("isPlainObject rejects null, arrays and primitives", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject("x")).toBe(false);
  });
  it("SLUG_RE accepts page slugs and rejects dangerous ones", () => {
    expect(SLUG_RE.test("volt-50000")).toBe(true);
    for (const bad of ["__proto__", "constructor", "Home", "../x", "", "a b"]) {
      expect(SLUG_RE.test(bad) && !["constructor"].includes(bad)).toBe(false);
    }
  });
  it("handleError maps known errors", async () => {
    expect((await handleError(new StorageUnavailableError())).status).toBe(503);
    const corrupt = await handleError(new StorageCorruptError("pages"));
    expect(corrupt.status).toBe(503);
    expect((await corrupt.json()).error).toContain('"pages"');
    expect((await handleError(new ConfigError("missing"))).status).toBe(500);
    expect((await handleError(new Error("boom"))).status).toBe(500);
  });
});
