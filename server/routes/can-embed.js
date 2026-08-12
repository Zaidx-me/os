import { Router } from "express";
import { headersAllowEmbed, CAN_EMBED_CACHE_TTL_MS } from "../lib/can-embed-check.js";

const cache = new Map();

function isPublicHttpUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export const canEmbedRouter = Router();

canEmbedRouter.get("/", async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "missing url" });
  }
  if (!isPublicHttpUrl(url)) {
    return res.json({ embeddable: false });
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.checkedAt < CAN_EMBED_CACHE_TTL_MS) {
    return res.json({ embeddable: cached.embeddable });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZaidOS-EmbedCheck/1.0)" },
    });
    clearTimeout(timeout);

    const embeddable = headersAllowEmbed(
      response.headers.get("x-frame-options"),
      response.headers.get("content-security-policy"),
    );
    try {
      await response.body?.cancel?.();
    } catch {
      /* ignore */
    }
    cache.set(url, { embeddable, checkedAt: Date.now() });
    return res.json({ embeddable });
  } catch {
    cache.set(url, { embeddable: false, checkedAt: Date.now() });
    return res.json({ embeddable: false });
  }
});
