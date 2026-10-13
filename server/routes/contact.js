import { Router } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import { env } from "../config/env.js";
import { contactLimiter } from "../middleware/rateLimiters.js";

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(""),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().optional().default(""),
});

function transporter() {
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

contactRouter.post("/", contactLimiter, async (req, res, next) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please check the form fields and try again." });
    }
    if (parsed.data.website) {
      return res.json({ success: true });
    }

    if (!env.smtp.host || !env.contactToEmail || !env.smtp.user || !env.smtp.pass) {
      return res.status(503).json({ error: "Email delivery is not configured. Please contact us directly." });
    }

    if (env.smtp.host && env.contactToEmail) {
      await transporter().sendMail({
        from: env.smtp.from,
        to: env.contactToEmail,
        replyTo: parsed.data.email,
        subject: `New website enquiry: ${parsed.data.service}`,
        text: [
          `Name: ${parsed.data.name}`,
          `Email: ${parsed.data.email}`,
          `Phone: ${parsed.data.phone}`,
          `Service: ${parsed.data.service}`,
          "",
          parsed.data.message,
        ].join("\n"),
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});
