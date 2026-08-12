/** Resend sender — empty RESEND_FROM must not override the sandbox default. */
export const DEFAULT_RESEND_FROM = "ZaidOS Portfolio <onboarding@resend.dev>";

export function getResendFrom() {
  const configured = process.env.RESEND_FROM?.trim();
  return configured || DEFAULT_RESEND_FROM;
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.CONTACT_TO_EMAIL?.trim());
}

/** Map Resend API errors to actionable messages for the contact UI. */
export function resendErrorMessage(error) {
  const msg = typeof error?.message === "string" ? error.message : "";
  if (msg.includes("domain is invalid")) {
    return "Invalid sender address — remove RESEND_FROM from .env or use a verified domain.";
  }
  if (msg.includes("only send testing emails to your own email")) {
    return "Resend free tier: set CONTACT_TO_EMAIL to your Resend account email, or verify a domain at resend.com/domains.";
  }
  return "Message could not be sent. Try again later.";
}
