/** Shared API status helpers — distinguishes offline server vs missing env keys. */
const STATUS_TIMEOUT_MS = 10_000;

async function fetchStatusJson(path, signal) {
  const res = await fetch(path, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchWithRetry(path) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
    try {
      const data = await fetchStatusJson(path, controller.signal);
      window.clearTimeout(timeout);
      if (data) return data;
    } catch {
      window.clearTimeout(timeout);
      if (attempt === 1) break;
      await new Promise((r) => window.setTimeout(r, 400));
    }
  }
  return null;
}

export async function fetchChatStatus() {
  try {
    const data = await fetchWithRetry("/api/chat/status");
    if (!data) {
      return { llm: false, resend: false, api: false, offline: true, loading: false };
    }
    return { ...data, api: true, offline: false, loading: false };
  } catch {
    return { llm: false, resend: false, api: false, offline: true, loading: false };
  }
}

export async function fetchContactStatus() {
  try {
    const data = await fetchWithRetry("/api/contact/status");
    if (!data) {
      return { resend: false, api: false, offline: true, loading: false };
    }
    return { ...data, api: true, offline: false, loading: false };
  } catch {
    return { resend: false, api: false, offline: true, loading: false };
  }
}

export function statusHint(kind, status) {
  if (status.loading) return null;
  if (status.offline) {
    return "API offline — run npm run dev (needs server on :5174).";
  }
  if (kind === "llm" && !status.llm) {
    return "Add LLM_API_KEY to .env and restart the server.";
  }
  if (kind === "resend" && !status.resend) {
    return "Add RESEND_API_KEY and CONTACT_TO_EMAIL to .env.";
  }
  return null;
}
