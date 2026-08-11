"use client";

import { useState, type FormEvent } from "react";

import { Icon } from "@/components/ui/Icon";
import { site, socials } from "@/content";

/**
 * Contact (contact) — a form to reach the owner.
 *
 * Fields: name / email / subject / message plus a visually-hidden `website`
 * honeypot (never a visible field; the API answers 200 silently when a bot
 * fills it). Client-side validation mirrors the API's lightweight check
 * (required + email regex). Submit POSTs to /api/contact; success shows a
 * green confirmation. On 501 (email not configured server-side) or a network
 * abort, the form offers a mailto: fallback link composed from the typed
 * subject/body; on 429 it shows the rate-limit message instead. A socials
 * row (content/socials.ts) and a copy-email button sit beside the form.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = "name" | "email" | "subject" | "message";

type FieldErrors = Partial<Record<FieldName, string>>;

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success" }
  | { status: "error"; hint: string; mailto: string | null };

const EMPTY_FIELDS: Record<FieldName, string> = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const LABELS: Record<FieldName, string> = {
  name: "Name",
  email: "Email",
  subject: "Subject",
  message: "Message",
};

function mailtoHref(fields: Record<FieldName, string>): string {
  const subject = `Portfolio contact from ${fields.name}`;
  const body = `${fields.message}\n\n— ${fields.name} (${fields.email})`;
  return `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactApp() {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  function update(field: FieldName, value: string) {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fields.name.trim()) next.name = "Name is required.";
    if (!fields.email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(fields.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!fields.subject.trim()) next.subject = "Subject is required.";
    if (!fields.message.trim()) next.message = "Message is required.";
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmit({ status: "sending" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, website }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          setSubmit({
            status: "error",
            hint: "You're sending too fast — wait a moment.",
            mailto: null,
          });
          return;
        }
        setSubmit({
          status: "error",
          hint: "The server couldn't send it — try again in a bit.",
          mailto: response.status === 501 ? mailtoHref(fields) : null,
        });
        return;
      }
      setSubmit({ status: "success" });
      setFields(EMPTY_FIELDS);
    } catch {
      setSubmit({
        status: "error",
        hint: "Network hiccup — check your connection and try again.",
        mailto: mailtoHref(fields),
      });
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.contactEmail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      data-testid="app-content-contact"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-6 p-6">
        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            Contact
          </h2>
          <p className="font-mono text-xs text-zaid-text">
            Say hi — questions, collabs, or just to talk shop.
          </p>
        </section>

        <form
          data-testid="contact-form"
          className="flex flex-col gap-4"
          onSubmit={onSubmit}
          noValidate
        >
          <input
            type="text"
            data-testid="contact-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          {(Object.keys(LABELS) as FieldName[]).map((field) => (
            <label
              key={field}
              data-testid={`contact-field-${field}`}
              className="flex flex-col gap-1.5"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
                {LABELS[field]}
              </span>
              {field === "message" ? (
                <textarea
                  data-testid={`contact-${field}`}
                  value={fields[field]}
                  onChange={(e) => update(field, e.target.value)}
                  rows={5}
                  placeholder="Your message…"
                  className="hairline w-full resize-y rounded-lg bg-zaid-surface2 px-3 py-2 font-mono text-xs text-zaid-text placeholder:text-zaid-muted focus:border-zaid-accent focus:outline-none"
                />
              ) : (
                <input
                  data-testid={`contact-${field}`}
                  type={field === "email" ? "email" : "text"}
                  value={fields[field]}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={`Your ${LABELS[field].toLowerCase()}…`}
                  className="hairline w-full rounded-lg bg-zaid-surface2 px-3 py-2 font-mono text-xs text-zaid-text placeholder:text-zaid-muted focus:border-zaid-accent focus:outline-none"
                />
              )}
              {errors[field] ? (
                <span
                  data-testid={`contact-error-${field}`}
                  className="font-mono text-[10px] text-zaid-danger"
                >
                  {errors[field]}
                </span>
              ) : null}
            </label>
          ))}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              data-testid="contact-submit"
              disabled={submit.status === "sending"}
              className="hairline w-fit rounded-lg bg-zaid-accent px-4 py-2 font-mono text-xs font-semibold text-zaid-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submit.status === "sending" ? "Sending…" : "Send message"}
            </button>

            {submit.status === "success" ? (
              <p
                data-testid="contact-success"
                className="font-mono text-xs text-zaid-success"
              >
                Message sent — I&apos;ll reply soon.
              </p>
            ) : null}

            {submit.status === "error" ? (
              <div data-testid="contact-error" className="flex flex-col gap-1">
                <p className="font-mono text-xs text-zaid-danger">
                  Something went wrong.
                </p>
                <p className="font-mono text-[10px] text-zaid-muted">
                  {submit.hint}
                </p>
                {submit.mailto !== null ? (
                  <a
                    data-testid="contact-mailto"
                    href={submit.mailto}
                    className="font-mono text-xs text-zaid-accent underline"
                  >
                    Send it directly via email instead
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </form>

        <section
          data-testid="contact-socials"
          className="flex flex-col gap-3"
        >
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            Elsewhere
          </h2>
          <ul className="flex flex-col gap-2">
            {socials.map((s) => (
              <li key={s.id}>
                <a
                  data-testid={`contact-social-${s.id}`}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-zaid-text transition-colors hover:text-zaid-accent"
                >
                  <Icon name="at-sign" size={14} />
                  <span>{s.label}</span>
                  <span className="text-zaid-muted">{s.handle}</span>
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-testid="contact-copy-email"
            onClick={copyEmail}
            className="hairline flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs text-zaid-accent transition-colors hover:bg-zaid-surface2"
          >
            <Icon name="copy" size={14} />
            {copied ? "Copied" : site.contactEmail}
          </button>
        </section>
      </div>
    </div>
  );
}

export default ContactApp;
