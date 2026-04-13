import type { RequestHandler } from "express";
import crypto from "crypto";

// Partner API keys stored in env as comma-separated: PARTNER_API_KEYS=key1,key2
function getValidApiKeys(): Set<string> {
  const raw = process.env.PARTNER_API_KEYS || "";
  return new Set(raw.split(",").map(k => k.trim()).filter(Boolean));
}

export const apiKeyAuth: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || typeof apiKey !== "string") {
    return res.status(401).json({ message: "API key required. Provide X-Api-Key header." });
  }

  const validKeys = getValidApiKeys();
  if (validKeys.size === 0) {
    return res.status(503).json({ message: "Partner API not configured." });
  }

  const isValid = [...validKeys].some(validKey => {
    try {
      const aStr = apiKey.padEnd(Math.max(apiKey.length, validKey.length), '\0');
      const bStr = validKey.padEnd(Math.max(apiKey.length, validKey.length), '\0');
      const a = Buffer.from(aStr);
      const b = Buffer.from(bStr);
      return a.length === b.length && crypto.timingSafeEqual(a, b) && apiKey === validKey;
    } catch {
      return false;
    }
  });

  if (!isValid) {
    return res.status(403).json({ message: "Invalid API key." });
  }

  next();
};
