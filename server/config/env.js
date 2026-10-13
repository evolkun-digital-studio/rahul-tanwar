import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  siteUrl: process.env.SITE_URL || "https://rahultanwar.com",
  contactToEmail: process.env.CONTACT_TO_EMAIL || "",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  },
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
};

export function requireEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
