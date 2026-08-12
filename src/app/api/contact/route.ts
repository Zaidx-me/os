import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Contact form submission endpoint (todo 22).
 *
 * Validates the body with a lightweight check (required fields + email
 * regex — no zod dependency), then relays via the Resend SDK ONLY when
 * RESEND_API_KEY and CONTACT_TO_EMAIL are configured; otherwise it answers
 * 501 { message: "mailto" } so the client falls back to a mailto: link.
 * Never throws: every failure path returns a JSON error response. Logs
 * never include PII (email/name) — the success log carries just the Resend
 * message id, and failure logs carry only the non-PII error message.
 *
 * Anti-spam is demo-grade by design (per-instance, not a security control):
 * a hidden `website` honeypot field short-circuits bots with a silent 200,
 * and an in-memory rate limit (5/min/IP) answers 429.
 */

/** Practical email regex — same shape the Contact app form uses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Upper bounds to reject absurd payloads before they reach Resend. */
const MAX_LENGTHS = { name: 100, subject: 200, message: 10_000 } as const;

/** Demo-grade in-memory rate limit — per instance, not a security control. */
const RATE_LIMIT = { max: 5, windowMs: 60_000 } as const;
const attempts = new Map<string, number[]>();

export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    "anon"
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT.windowMs,
  );
  if (recent.length >= RATE_LIMIT.max) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Body must be a JSON object." },
      { status: 400 },
    );
  }

  const record = body as Record<string, unknown>;

  if (typeof record.website === "string" && record.website.trim() !== "") {
    // Honeypot tripped: answer 200 without sending so bots learn nothing.
    return NextResponse.json({ ok: true });
  }

  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const subject =
    typeof record.subject === "string" ? record.subject.trim() : "";
  const message =
    typeof record.message === "string" ? record.message.trim() : "";

  const invalid: string[] = [];
  if (!name || name.length > MAX_LENGTHS.name) invalid.push("name");
  if (!email || !EMAIL_RE.test(email)) invalid.push("email");
  if (!subject || subject.length > MAX_LENGTHS.subject) invalid.push("subject");
  if (!message || message.length > MAX_LENGTHS.message) invalid.push("message");
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid field(s): ${invalid.join(", ")}.` },
      { status: 400 },
    );
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "You're sending too fast — wait a moment." },
      { status: 429 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ message: "mailto" }, { status: 501 });
  }

  try {
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM ?? "ZaidOS Portfolio <onboarding@resend.dev>";
    // v6 SDK: returns { data, error } — does NOT throw on API failure.
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Portfolio contact: ${subject}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr/><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    });

    if (error) {
      console.error("contact: resend refused the message:", error.message);
      return NextResponse.json(
        { error: "Message could not be sent. Try again later." },
        { status: 500 },
      );
    }

    console.log(
      "contact: message accepted by Resend",
      data ? `id=${data.id}` : "",
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "contact: unexpected failure:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.json(
      { error: "Message could not be sent. Try again later." },
      { status: 500 },
    );
  }
}
