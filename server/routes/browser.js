import { Router } from "express";
import {
  embedViewerUrl,
  isPublicHttpUrl,
  notteGoto,
  notteSessionStatus,
  notteStartSession,
  notteStopSession,
} from "../lib/notte-client.js";

export const browserRouter = Router();

function parseViewport(body) {
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

browserRouter.post("/", async (req, res) => {
  const apiKey = process.env.NOTTE_API_KEY?.trim();
  if (!apiKey) {
    return res.status(501).json({ mode: "fallback" });
  }

  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  if (!url || !isPublicHttpUrl(url)) {
    return res.status(400).json({ error: "invalid url" });
  }

  const viewport = parseViewport(req.body ?? {});
  let sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";

  try {
    let viewerUrl = null;

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
      return res.status(502).json({ error: "No viewer URL from Notte" });
    }

    return res.json({
      mode: "notte",
      sessionId,
      viewerUrl: embedViewerUrl(viewerUrl),
    });
  } catch (err) {
    console.error("browser session:", err instanceof Error ? err.message : err);
    return res.status(502).json({ error: "Cloud browser unavailable" });
  }
});

browserRouter.delete("/", async (req, res) => {
  const apiKey = process.env.NOTTE_API_KEY?.trim();
  const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
  if (apiKey && sessionId) {
    await notteStopSession(apiKey, sessionId);
  }
  return res.json({ ok: true });
});
