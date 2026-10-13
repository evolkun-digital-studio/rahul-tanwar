import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.admin = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
