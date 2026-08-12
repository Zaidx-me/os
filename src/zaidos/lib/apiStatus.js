/** Shared API status helpers — distinguishes offline server vs missing env keys. */
export async function fetchChatStatus() {
  try {
    const res = await fetch("/api/chat/status");
    if (!res.ok) return { llm: false, resend: false, api: false, offline: false };
    const data = await res.json();
    return { ...data, api: true, offline: false };
  } catch {
    return { llm: false, resend: false, api: false, offline: true };
  }
}

export async function fetchContactStatus() {
  try {
    const res = await fetch("/api/contact/status");
    if (!res.ok) return { resend: false, api: false, offline: false };
    const data = await res.json();
    return { ...data, api: true, offline: false };
  } catch {
    return { resend: false, api: false, offline: true };
  }
}

export function statusHint(kind, status) {
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
