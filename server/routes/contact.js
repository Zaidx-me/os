import { Router } from "express";
import { Resend } from "resend";
import { getResendFrom, isResendConfigured, resendErrorMessage } from "../lib/resend-config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { name: 100, subject: 200, message: 10_000 };
const RATE_LIMIT = { max: 5, windowMs: 60_000 };
const attempts = new Map();

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clientIp(req) {
  return req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"] ?? "anon";
}

function rateLimited(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export const contactRouter = Router();

contactRouter.get("/status", (_req, res) => {
  res.json({
    resend: isResendConfigured(),
    to: Boolean(process.env.CONTACT_TO_EMAIL?.trim()),
  });
});

contactRouter.post("/", async (req, res) => {
  const record = req.body ?? {};

  if (typeof record.website === "string" && record.website.trim() !== "") {
    return res.json({ ok: true });
  }

  const name = typeof record.name === "string" ? record.name.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const subject = typeof record.subject === "string" ? record.subject.trim() : "";
  const message = typeof record.message === "string" ? record.message.trim() : "";

  const invalid = [];
  if (!name || name.length > MAX_LENGTHS.name) invalid.push("name");
  if (!email || !EMAIL_RE.test(email)) invalid.push("email");
  if (!subject || subject.length > MAX_LENGTHS.subject) invalid.push("subject");
  if (!message || message.length > MAX_LENGTHS.message) invalid.push("message");
  if (invalid.length > 0) {
    return res.status(400).json({ error: `Invalid field(s): ${invalid.join(", ")}.` });
  }

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: "You're sending too fast — wait a moment." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return res.status(501).json({ message: "mailto" });
  }

  try {
    const resend = new Resend(apiKey);
    const from = getResendFrom();
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Portfolio contact: ${subject}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr/><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
    });

    if (error) {
      console.error("contact: resend refused:", error.message);
      return res.status(500).json({ error: resendErrorMessage(error) });
    }

    console.log("contact: accepted", data ? `id=${data.id}` : "");
    return res.json({ ok: true });
  } catch (err) {
    console.error("contact: failure:", err instanceof Error ? err.message : "unknown");
    return res.status(500).json({ error: "Message could not be sent. Try again later." });
  }
});
