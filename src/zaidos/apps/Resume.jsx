import { experience, projects, site, skillGroups, socials } from "../content/index.ts";

const CONTACT_IDS = ["github", "linkedin", "linktree"];

export default function ResumeApp() {
  const contact = CONTACT_IDS.map((id) => socials.find((s) => s.id === id)).filter(Boolean);
  const work = experience.filter((e) => e.type !== "education");
  const education = experience.filter((e) => e.type === "education");
  const featured = projects.filter((p) => p.featured);

  return (
    <div className="mobile-app-scroll h-full overflow-y-auto bg-white p-4 pb-8 dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 sm:p-6">
      <div className="flex justify-end p-3 border-b border-gray-200 dark:border-white/10 print:hidden">
        <button type="button" onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white">
          Print / Save PDF
        </button>
      </div>
      <article className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
        <header className="border-b border-gray-200 dark:border-white/10 pb-4">
          <h1 className="text-3xl font-semibold">{site.owner}</h1>
          <p className="text-green-600 dark:text-green-400 font-mono text-sm mt-1">{site.roleLine}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {contact.map((s) => (
              <a key={s.id} href={s.url} className="text-blue-600 dark:text-blue-400 hover:underline">{s.label}</a>
            ))}
          </div>
        </header>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Summary</h2>
          {site.bio.map((p) => (
            <p key={p.slice(0, 24)} className="text-sm leading-relaxed mb-2">{p}</p>
          ))}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Skills</h2>
          {skillGroups.map((g) => (
            <p key={g.id} className="text-sm mb-1"><strong>{g.label}:</strong> {g.skills.map((s) => s.name).join(", ")}</p>
          ))}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Experience</h2>
          {work.map((e) => (
            <div key={e.id} className="mb-3">
              <div className="font-semibold text-sm">{e.role}{e.org ? ` — ${e.org}` : ""}</div>
              <ul className="text-sm text-gray-600 dark:text-gray-300 ml-4 list-disc">
                {e.bullets.map((b) => <li key={b.slice(0, 20)}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Education</h2>
          {education.map((e) => (
            <div key={e.id} className="text-sm mb-2">
              <div className="font-semibold">{e.role} — {e.org}</div>
              {e.bullets[0] && <p className="text-gray-600 dark:text-gray-300">{e.bullets[0]}</p>}
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Featured Projects</h2>
          {featured.map((p) => (
            <div key={p.id} className="mb-2 text-sm">
              <span className="font-semibold">{p.title}</span> — {p.tagline}
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
