export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function getAuthConfig(source: NodeJS.ProcessEnv = process.env) {
  const missing = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"].filter((key) => !source[key]);
  if (missing.length) {
    throw new ConfigError(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (source.NODE_ENV === "production" && (source.JWT_SECRET as string).length < 16) {
    throw new ConfigError("JWT_SECRET must be at least 16 characters in production");
  }
  return {
    jwtSecret: source.JWT_SECRET as string,
    adminEmail: source.ADMIN_EMAIL as string,
    adminPassword: source.ADMIN_PASSWORD as string,
  };
}

export function getSiteUrl(source: NodeJS.ProcessEnv = process.env) {
  return (source.SITE_URL || "https://rahultanwar.com").replace(/\/+$/, "");
}

export function getMailConfig(source: NodeJS.ProcessEnv = process.env) {
  return {
    host: source.SMTP_HOST || "",
    port: Number(source.SMTP_PORT || 587),
    secure: source.SMTP_SECURE === "true",
    user: source.SMTP_USER || "",
    pass: source.SMTP_PASS || "",
    from: source.SMTP_FROM || source.SMTP_USER || "",
    to: source.CONTACT_TO_EMAIL || "",
  };
}

export function getOpenAiConfig(source: NodeJS.ProcessEnv = process.env) {
  return { apiKey: source.OPENAI_API_KEY || "", model: source.OPENAI_MODEL || "gpt-4.1-mini" };
}
