const NOTTE_API_BASE = "https://api.notte.cc";

export interface NotteSessionResponse {
  session_id: string;
  viewer_url?: string | null;
  status?: string;
}

export function isPublicHttpUrl(raw: string): boolean {
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

/** Append embed-friendly viewer params for in-app iframe chrome. */
export function embedViewerUrl(viewerUrl: string, theme: "light" | "dark" = "dark"): string {
  const url = new URL(viewerUrl);
  url.searchParams.set("mode", "embed-minimal");
  url.searchParams.set("interactive", "1");
  url.searchParams.set("theme", theme);
  return url.toString();
}

function notteHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "X-Notte-Request-Origin": "zaidos-browser",
  };
}

export async function notteStartSession(
  apiKey: string,
  viewport: { width: number; height: number },
): Promise<NotteSessionResponse> {
  const res = await fetch(`${NOTTE_API_BASE}/sessions/start`, {
    method: "POST",
    headers: notteHeaders(apiKey),
    body: JSON.stringify({
      headless: true,
      solve_captchas: true,
      max_duration_minutes: 15,
      idle_timeout_minutes: 5,
      browser_type: "chromium",
      viewport_width: viewport.width,
      viewport_height: viewport.height,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`Notte session start failed (${res.status})`);
  }

  return (await res.json()) as NotteSessionResponse;
}

export async function notteSessionStatus(
  apiKey: string,
  sessionId: string,
): Promise<NotteSessionResponse> {
  const res = await fetch(`${NOTTE_API_BASE}/sessions/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: notteHeaders(apiKey),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Notte session status failed (${res.status})`);
  }

  return (await res.json()) as NotteSessionResponse;
}

export async function notteGoto(
  apiKey: string,
  sessionId: string,
  url: string,
): Promise<void> {
  const res = await fetch(
    `${NOTTE_API_BASE}/sessions/${encodeURIComponent(sessionId)}/page/execute`,
    {
      method: "POST",
      headers: notteHeaders(apiKey),
      body: JSON.stringify({ type: "goto", url }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!res.ok) {
    throw new Error(`Notte goto failed (${res.status})`);
  }
}

export async function notteStopSession(apiKey: string, sessionId: string): Promise<void> {
  await fetch(`${NOTTE_API_BASE}/sessions/${encodeURIComponent(sessionId)}/stop`, {
    method: "DELETE",
    headers: notteHeaders(apiKey),
    signal: AbortSignal.timeout(10_000),
  });
}
