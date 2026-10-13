import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env.js";
import { chatLimiter } from "../middleware/rateLimiters.js";

export const chatRouter = Router();

const chatSchema = z.object({
  message: z.string().trim().min(2).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(1000),
      }),
    )
    .max(8)
    .optional()
    .default([]),
});

const systemPrompt = `You are RT Intelligence, the website assistant for Rahul Tanwar and SR18's venture ecosystem.
Answer concisely and professionally using only public website context.
Relevant ventures include SR18 Gaming, Delhi 6, Volt 50000, Masai, Adatto and Arnika Textiles.
For partnerships, investments, media, hiring, or detailed commercial discussions, ask the visitor to use the contact form.
Do not invent confidential financials, private phone numbers, or non-public claims.`;

chatRouter.post("/", chatLimiter, async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid chat request" });
    }
    if (!env.openaiApiKey) {
      return res.status(503).json({ error: "Chat is not configured yet" });
    }

    const openai = new OpenAI({ apiKey: env.openaiApiKey });
    const completion = await openai.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.4,
      max_tokens: 260,
      messages: [
        { role: "system", content: systemPrompt },
        ...parsed.data.history,
        { role: "user", content: parsed.data.message },
      ],
    });

    res.json({ reply: completion.choices[0]?.message?.content || "Please use the contact form and the team will respond." });
  } catch (error) {
    next(error);
  }
});
