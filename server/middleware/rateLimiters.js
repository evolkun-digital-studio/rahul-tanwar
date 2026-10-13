import rateLimit from "express-rate-limit";

export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
