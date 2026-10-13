import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn().mockResolvedValue({});
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail }) } }));

const create = vi.fn();
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create } };
  },
}));

import { POST as chat } from "../../app/api/chat/route";
import { POST as contact } from "../../app/api/contact/route";
import { resetLimitersForTests } from "./ratelimit";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  service: "Partnership",
  message: "I would like to discuss a partnership.",
  website: "",
};
const post = (path: string, body: BodyInit, ip = "1.1.1.1") =>
  new Request(`http://x${path}`, { method: "POST", body, headers: { "x-forwarded-for": ip } });

beforeEach(() => {
  resetLimitersForTests();
  sendMail.mockClear();
  create.mockReset();
  process.env.SMTP_HOST = "smtp.test";
  process.env.SMTP_USER = "u";
  process.env.SMTP_PASS = "p";
  process.env.CONTACT_TO_EMAIL = "to@example.com";
  process.env.OPENAI_API_KEY = "sk-test";
});

describe("POST /api/contact", () => {
  it("sends mail and returns 201", async () => {
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0]).toMatchObject({ to: "to@example.com", replyTo: "ada@example.com" });
  });
  it("silently succeeds for honeypot submissions without sending", async () => {
    const res = await contact(post("/api/contact", JSON.stringify({ ...valid, website: "http://spam" })));
    expect(res.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it("returns 400 for invalid fields", async () => {
    const res = await contact(post("/api/contact", JSON.stringify({ ...valid, email: "nope" })));
    expect(res.status).toBe(400);
  });
  it("returns 400 for malformed, empty and non-object bodies", async () => {
    for (const body of ["{oops", "", "[]", "null"]) {
      expect((await contact(post("/api/contact", body))).status).toBe(400);
    }
  });
  it("returns 503 when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(503);
  });
  it("returns 500 JSON when the transport throws", async () => {
    sendMail.mockRejectedValueOnce(new Error("smtp down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await contact(post("/api/contact", JSON.stringify(valid)));
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
  it("rate limits the 6th request from one IP within the window", async () => {
    let status = 0;
    for (let i = 0; i < 6; i++) status = (await contact(post("/api/contact", JSON.stringify(valid)))).status;
    expect(status).toBe(429);
  });
});

describe("POST /api/chat", () => {
  it("returns the model reply", async () => {
    create.mockResolvedValue({ choices: [{ message: { content: "Hello!" } }] });
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reply: "Hello!" });
  });
  it("falls back to a contact-form message when the model returns nothing", async () => {
    create.mockResolvedValue({ choices: [] });
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect((await res.json()).reply).toMatch(/contact form/i);
  });
  it("returns 400 for invalid or oversized messages and malformed JSON", async () => {
    expect((await chat(post("/api/chat", JSON.stringify({ message: "x" })))).status).toBe(400);
    expect((await chat(post("/api/chat", JSON.stringify({ message: "x".repeat(1001) })))).status).toBe(400);
    expect((await chat(post("/api/chat", "{oops"))).status).toBe(400);
  });
  it("returns 503 when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await chat(post("/api/chat", JSON.stringify({ message: "Hi there" })));
    expect(res.status).toBe(503);
  });
});
