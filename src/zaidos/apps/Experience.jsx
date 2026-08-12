import { experience } from "../content/index.ts";

const GROUPS = [
  { type: "education", label: "Education" },
  { type: "work", label: "Work" },
  { type: "freelance", label: "Freelance" },
];

export default function ExperienceApp() {
  return (
    <div className="mobile-app-scroll h-full overflow-y-auto bg-[#f5f5f7] p-4 pb-8 dark:bg-[#1c1c1e] sm:p-6">
      <h1 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Experience</h1>
      {GROUPS.map(({ type, label }) => {
        const entries = experience.filter((e) => e.type === type);
        if (entries.length === 0) return null;
        return (
          <section key={type} className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">{label}</h2>
            <ol className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-xl bg-white dark:bg-[#2c2c2e] p-4 border border-black/5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{entry.role}</span>
                    {entry.current && (
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-green-500/50 text-green-600">Current</span>
                    )}
                  </div>
                  {entry.org && <p className="text-xs text-gray-500 mt-1">{entry.org}</p>}
                  <ul className="mt-2 space-y-1">
                    {entry.bullets.map((b) => (
                      <li key={b.slice(0, 20)} className="text-sm text-gray-600 dark:text-gray-300">• {b}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
