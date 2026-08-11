"use client";

import { useEffect, useRef, useState } from "react";

import { isWhitelistedUrl, resolveEmbedUrl } from "@/lib/browser/embed-whitelist";

export type BrowserEmbedPhase = "idle" | "checking" | "embedded" | "blocked";
export type BrowserEmbedKind = "direct" | "notte" | null;

const IFRAME_LOAD_TIMEOUT_MS = 8000;
const NOTTE_LOAD_TIMEOUT_MS = 25_000;

async function stopNotteSession(sessionId: string) {
  try {
    await fetch("/api/browser/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // Best-effort cleanup.
  }
}

export function useBrowserEmbed(url: string, isStart: boolean, refreshKey = 0) {
  const [phase, setPhase] = useState<BrowserEmbedPhase>("idle");
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [embedKind, setEmbedKind] = useState<BrowserEmbedKind>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    setLoadTimedOut(false);

    if (isStart) {
      setPhase("idle");
      setFrameSrc(null);
      setEmbedKind(null);
      return;
    }

    if (isWhitelistedUrl(url)) {
      setFrameSrc(resolveEmbedUrl(url));
      setEmbedKind("direct");
      setPhase("embedded");
      return;
    }

    setPhase("checking");
    setFrameSrc(null);
    setEmbedKind(null);
    let cancelled = false;

    const run = async () => {
      const previousSessionId = sessionIdRef.current;
      sessionIdRef.current = null;

      try {
        const notteRes = await fetch("/api/browser/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            sessionId: previousSessionId ?? undefined,
            viewportWidth: typeof window !== "undefined" ? window.innerWidth : 1280,
            viewportHeight: typeof window !== "undefined" ? window.innerHeight : 720,
          }),
        });

        if (cancelled) return;

        if (notteRes.ok) {
          const data = (await notteRes.json()) as {
            sessionId?: string;
            viewerUrl?: string;
          };
          if (data.viewerUrl && data.sessionId) {
            sessionIdRef.current = data.sessionId;
            setFrameSrc(data.viewerUrl);
            setEmbedKind("notte");
            setPhase("embedded");
            return;
          }
        }
      } catch {
        if (cancelled) return;
      }

      try {
        const embedRes = await fetch(`/api/can-embed?url=${encodeURIComponent(url)}`);
        const data = (await embedRes.json()) as { embeddable?: boolean };
        if (cancelled) return;
        if (data.embeddable) {
          setFrameSrc(url);
          setEmbedKind("direct");
          setPhase("embedded");
        } else {
          setPhase("blocked");
        }
      } catch {
        if (!cancelled) setPhase("blocked");
      }
    };

    void run();

    return () => {
      cancelled = true;
      const sid = sessionIdRef.current;
      sessionIdRef.current = null;
      if (sid) void stopNotteSession(sid);
    };
  }, [url, isStart, refreshKey]);

  useEffect(() => {
    if (phase !== "embedded" || !frameSrc) {
      setLoadTimedOut(false);
      return;
    }

    const timeoutMs = embedKind === "notte" ? NOTTE_LOAD_TIMEOUT_MS : IFRAME_LOAD_TIMEOUT_MS;
    const id = window.setTimeout(() => setLoadTimedOut(true), timeoutMs);
    return () => window.clearTimeout(id);
  }, [phase, frameSrc, url, embedKind]);

  const effectivePhase =
    phase === "embedded" && loadTimedOut ? ("blocked" as const) : phase;

  return {
    phase: effectivePhase,
    embedKind: effectivePhase === "embedded" ? embedKind : null,
    frameSrc: effectivePhase === "embedded" ? frameSrc : null,
    onFrameLoad: () => setLoadTimedOut(false),
  };
}
