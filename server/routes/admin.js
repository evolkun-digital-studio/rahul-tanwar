import { Router } from "express";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/rateLimiters.js";
import {
  readMedia,
  readPages,
  readSettings,
  writeMedia,
  writePages,
  writeSettings,
} from "../lib/jsonStore.js";

export const adminRouter = Router();

adminRouter.post("/login", adminLimiter, async (req, res, next) => {
  try {
    const parsed = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid login details" });

    if (parsed.data.email !== env.adminEmail || parsed.data.password !== env.adminPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ sub: "env-admin", email: env.adminEmail }, env.jwtSecret, {
      expiresIn: "8h",
    });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

adminRouter.use(requireAdmin);

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [media, pages] = await Promise.all([readMedia(), readPages()]);
    res.json({ stats: { leads: 0, media: media.length, pages: Object.keys(pages).length } });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/pages/:slug", async (req, res, next) => {
  try {
    const pages = await readPages();
    const page = pages[req.params.slug] || null;
    res.json({ page });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/pages/:slug", async (req, res, next) => {
  try {
    const pages = await readPages();
    const page = {
      ...(pages[req.params.slug] || {}),
      ...req.body,
      slug: req.params.slug,
      updatedAt: new Date().toISOString(),
    };
    pages[req.params.slug] = page;
    await writePages(pages);
    res.json({ page });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/media", async (_req, res, next) => {
  try {
    const assets = await readMedia();
    res.json({ assets });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/media", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        url: z.string().trim().url(),
        altText: z.string().trim().max(300).optional().default(""),
        title: z.string().trim().max(160).optional().default(""),
        usageLocation: z.string().trim().max(160).optional().default(""),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Valid image URL is required" });

    const media = await readMedia();
    const asset = {
      id: randomUUID(),
      url: parsed.data.url,
      altText: parsed.data.altText,
      title: parsed.data.title || parsed.data.url,
      usageLocation: parsed.data.usageLocation,
      createdAt: new Date().toISOString(),
    };
    media.unshift(asset);
    await writeMedia(media);
    res.status(201).json({ asset });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await readSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/settings", async (req, res, next) => {
  try {
    const settings = { ...req.body, updatedAt: new Date().toISOString() };
    await writeSettings(settings);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});
