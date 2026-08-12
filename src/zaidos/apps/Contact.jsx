import { useEffect, useState } from "react";
import { ExternalLink, Mail, Send } from "lucide-react";
import { site, socials } from "../content/index.ts";
import { fetchContactStatus, statusHint } from "../lib/apiStatus.js";

const FIELDS = [
  { id: "name", label: "Name", type: "text", autoComplete: "name" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  { id: "subject", label: "Subject", type: "text", autoComplete: "off" },
];

export default function ContactApp() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [status, setStatus] = useState(null);
  const [api, setApi] = useState({ resend: false, api: false, offline: true });

  useEffect(() => {
    fetchContactStatus().then(setApi);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 501 && data.message === "mailto") {
        window.location.href = `mailto:${site.contactEmail}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)}`;
        setStatus("mailto");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to send");
    }
  }

  const resendLive = api.resend && !api.offline;
  const hint = statusHint("resend", api);

  return (
    <div className="contact-app mobile-app-scroll flex h-full min-h-0 flex-col bg-[#f2f2f7] dark:bg-black">
      <div className="shrink-0 border-b border-black/5 bg-[#f2f2f7]/95 px-4 pb-3 pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Contact</h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Message {site.owner.split(" ").slice(-1)[0]} directly
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              resendLive
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
            }`}
          >
            {resendLive ? "● Resend live" : api.offline ? "API offline" : "Mail fallback"}
          </span>
        </div>
        {hint && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {hint}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {socials.slice(0, 4).map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-white/10 dark:bg-[#2c2c2e] dark:text-gray-200"
            >
              {s.label}
              <ExternalLink size={12} className="opacity-50" />
            </a>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input type="text" name="website" value={form.website} onChange={() => {}} className="hidden" tabIndex={-1} autoComplete="off" />

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
            {FIELDS.map((f, i) => (
              <label key={f.id} className={`block px-4 py-3 ${i > 0 ? "border-t border-black/5 dark:border-white/10" : ""}`}>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {f.label}
                </span>
                <input
                  required
                  type={f.type}
                  autoComplete={f.autoComplete}
                  value={form[f.id]}
                  onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                  className="w-full bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                  placeholder={f.label}
                />
              </label>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-[#1c1c1e]">
            <label className="block px-4 py-3">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">Message</span>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                placeholder="What would you like to discuss?"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-[15px] font-semibold text-white shadow-sm active:scale-[0.99] disabled:opacity-50 dark:bg-blue-500"
          >
            {status === "sending" ? (
              "Sending…"
            ) : (
              <>
                <Send size={18} />
                {resendLive ? "Send via Resend" : "Send message"}
              </>
            )}
          </button>

          {status === "sent" && (
            <p className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
              Message sent — I&apos;ll reply soon.
            </p>
          )}
          {status === "mailto" && (
            <p className="rounded-xl bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              Opening your mail app…
            </p>
          )}
          {status && status !== "sent" && status !== "sending" && status !== "mailto" && (
            <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{status}</p>
          )}
        </form>

        <a
          href={`mailto:${site.contactEmail}`}
          className="mt-6 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400"
        >
          <Mail size={16} />
          {site.contactEmail}
        </a>
      </div>
    </div>
  );
}
