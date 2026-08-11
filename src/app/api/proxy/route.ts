import { NextResponse } from "next/server";

const MAX_BYTES = 2_000_000;

function isAllowedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Same-origin gateway so sites load inside ZaidOS Browser tabs (no pop-ups). */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZaidOS-Browser/1.0; +https://zaidx.me)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    const contentType = upstream.headers.get("content-type") ?? "text/html";
    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Response too large" }, { status: 413 });
    }

    if (!contentType.includes("text/html")) {
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
        },
      });
    }

    let html = new TextDecoder().decode(buffer);
    const parsed = new URL(url);
    const base = `<base href="${parsed.origin}/"><meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`;
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => `${m}${base}`);
    } else {
      html = `<head>${base}</head>${html}`;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
  }
}
