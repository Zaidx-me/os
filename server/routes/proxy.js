import { Router } from "express";

const MAX_BYTES = 2_000_000;

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return false;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export const proxyRouter = Router();

proxyRouter.get("/", async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string" || !isAllowedUrl(url)) {
    return res.status(400).json({ error: "Invalid or blocked URL" });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ZaidOS-Browser/1.0; +https://zaidx.me)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    const contentType = upstream.headers.get("content-type") ?? "text/html";
    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return res.status(413).json({ error: "Response too large" });
    }

    if (!contentType.includes("text/html")) {
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "no-store");
      return res.send(Buffer.from(buffer));
    }

    let html = new TextDecoder().decode(buffer);
    // Drop upstream CSP meta tags so module scripts can load via <base href>.
    html = html.replace(/<meta[^>]*http-equiv=["']content-security-policy["'][^>]*>/gi, "");

    const parsed = new URL(url);
    const base = `<base href="${parsed.origin}/"><meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${base}`);
    } else {
      html = `<head>${base}</head>${html}`;
    }

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.set("X-Frame-Options", "SAMEORIGIN");
    return res.send(html);
  } catch {
    return res.status(502).json({ error: "Failed to fetch URL" });
  }
});
