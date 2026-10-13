import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getAuthConfig } from "./env";
import { handleError, json } from "./http";

const encode = (value: string) => new TextEncoder().encode(value);

export function safeEqual(a: string, b: string) {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function checkCredentials(
  input: { email: string; password: string },
  creds: { adminEmail: string; adminPassword: string },
) {
  const emailOk = safeEqual(input.email, creds.adminEmail);
  const passwordOk = safeEqual(input.password, creds.adminPassword);
  return emailOk && passwordOk;
}

export function signAdminToken(email: string, secret: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("env-admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encode(secret));
}

export async function verifyAdminToken(token: string, secret: string) {
  try {
    await jwtVerify(token, encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request): Promise<Response | null> {
  try {
    const { jwtSecret } = getAuthConfig();
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return json({ error: "Authentication required" }, 401);
    if (!(await verifyAdminToken(token, jwtSecret))) {
      return json({ error: "Invalid or expired session" }, 401);
    }
    return null;
  } catch (error) {
    return handleError(error);
  }
}
