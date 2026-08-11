import { NextResponse } from "next/server";

import {
  embedViewerUrl,
  isPublicHttpUrl,
  notteGoto,
  notteSessionStatus,
  notteStartSession,
  notteStopSession,
} from "@/lib/browser/notte-client";

export const dynamic = "force-dynamic";

interface SessionPostBody {
  url?: unknown;
  sessionId?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
}

interface SessionDeleteBody {
  sessionId?: unknown;
}

function parseViewport(body: SessionPostBody): { width: number; height: number } {
  const width =
    typeof body.viewportWidth === "number" && body.viewportWidth >= 320
      ? Math.min(body.viewportWidth, 1920)
      : 1280;
  const height =
    typeof body.viewportHeight === "number" && body.viewportHeight >= 240
      ? Math.min(body.viewportHeight, 1080)
      : 720;
  return { width, height };
}

/** POST — start or reuse a Notte cloud browser session and navigate to `url`. */
export async function POST(request: Request) {
  const apiKey = process.env.NOTTE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ mode: "fallback" as const }, { status: 501 });
  }

  let body: SessionPostBody;
  try {
    body = (await request.json()) as SessionPostBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !isPublicHttpUrl(url)) {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const viewport = parseViewport(body);
  const existingId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

  try {
    let sessionId = existingId;
    let viewerUrl: string | null = null;

    if (sessionId) {
      try {
        const status = await notteSessionStatus(apiKey, sessionId);
        if (status.status === "active" && status.viewer_url) {
          viewerUrl = status.viewer_url;
        } else {
          sessionId = "";
        }
      } catch {
        sessionId = "";
      }
    }

    if (!sessionId) {
      const started = await notteStartSession(apiKey, viewport);
      sessionId = started.session_id;
      viewerUrl = started.viewer_url ?? null;
    }

    await notteGoto(apiKey, sessionId, url);

    if (!viewerUrl) {
      const status = await notteSessionStatus(apiKey, sessionId);
      viewerUrl = status.viewer_url ?? null;
    }

    if (!viewerUrl) {
      return NextResponse.json({ error: "missing viewer_url" }, { status: 502 });
    }

    return NextResponse.json({
      mode: "notte" as const,
      sessionId,
      viewerUrl: embedViewerUrl(viewerUrl),
    });
  } catch {
    return NextResponse.json({ error: "notte unavailable" }, { status: 502 });
  }
}

/** DELETE — stop an idle Notte session to avoid burning quota. */
export async function DELETE(request: Request) {
  const apiKey = process.env.NOTTE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: true });
  }

  let body: SessionDeleteBody;
  try {
    body = (await request.json()) as SessionDeleteBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  try {
    await notteStopSession(apiKey, sessionId);
  } catch {
    // Session may already be closed; still return success for cleanup UX.
  }

  return NextResponse.json({ ok: true });
}
