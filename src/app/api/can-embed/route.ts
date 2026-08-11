import { NextResponse } from "next/server";

import {
  CAN_EMBED_CACHE_TTL_MS,
  headersAllowEmbed,
} from "@/lib/browser/can-embed-check";

const cache = new Map<string, { embeddable: boolean; checkedAt: number }>();

function isPublicHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }
  if (!isPublicHttpUrl(url)) {
    return NextResponse.json({ embeddable: false });
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.checkedAt < CAN_EMBED_CACHE_TTL_MS) {
    return NextResponse.json({ embeddable: cached.embeddable });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZaidOS-EmbedCheck/1.0; +https://zaidx.me)",
      },
    });
    clearTimeout(timeout);

    const embeddable = headersAllowEmbed(
      response.headers.get("x-frame-options"),
      response.headers.get("content-security-policy"),
    );

    cache.set(url, { embeddable, checkedAt: Date.now() });
    return NextResponse.json({ embeddable });
  } catch {
    cache.set(url, { embeddable: false, checkedAt: Date.now() });
    return NextResponse.json({ embeddable: false });
  }
}
