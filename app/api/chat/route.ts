import OpenAI from "openai";
import { z } from "zod";
import { getOpenAiConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().trim().min(2).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1000) }))
    .max(8)
    .optional()
    .default([]),
});

const systemPrompt = `You are RT Intelligence, the website assistant for Rahul Tanwar and SR18's venture ecosystem.
Answer concisely and professionally using only public website context.
Relevant ventures include SR18 Gaming, Delhi 6, Volt 50000, Masai, Adatto and Arnika Textiles.
For partnerships, investments, media, hiring, or detailed commercial discussions, ask the visitor to use the contact form.
Do not invent confidential financials, private phone numbers, or non-public claims.`;

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("chat").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 20_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) return json({ error: "Invalid chat request" }, 400);

    const { apiKey, model } = getOpenAiConfig();
    if (!apiKey) return json({ error: "Chat is not configured yet" }, 503);

    const openai = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 });
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 260,
      messages: [
        { role: "system", content: systemPrompt },
        ...parsed.data.history,
        { role: "user", content: parsed.data.message },
      ],
    });
    return json({
      reply:
        completion.choices[0]?.message?.content ||
        "Please use the contact form and the team will respond.",
    });
  } catch (error) {
    return handleError(error);
  }
}
