import nodemailer from "nodemailer";
import { z } from "zod";
import { getMailConfig } from "@/server/env";
import { handleError, json, rateLimited, readJsonBody } from "@/server/http";
import { clientIp, getLimiter } from "@/server/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional().default(""),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
  website: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const limit = await getLimiter("contact").check(clientIp(req));
    if (!limit.success) return rateLimited(limit.retryAfter);

    const body = await readJsonBody(req, 20_000);
    if (!body.ok) return body.response;
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return json({ error: "Please check the form fields and try again." }, 400);
    }
    if (parsed.data.website) return json({ success: true });

    const mail = getMailConfig();
    if (!mail.host || !mail.to || !mail.user || !mail.pass) {
      return json({ error: "Email delivery is not configured. Please contact us directly." }, 503);
    }

    const transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth: { user: mail.user, pass: mail.pass },
    });
    await transporter.sendMail({
      from: mail.from,
      to: mail.to,
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
    return json({ success: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
