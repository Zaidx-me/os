import { skillGroups } from "../content/index.ts";

const CORE_STACK = ["React Native", "TypeScript", "Node.js", "Python", "C++", "FastAPI", "Docker", "Arch", "Hyprland"];

export default function SkillsApp() {
  return (
    <div className="mobile-app-scroll h-full overflow-y-auto bg-[#f5f5f7] p-4 pb-8 dark:bg-[#1c1c1e] sm:p-6">
      <h1 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Skills</h1>
      <p className="text-xs text-gray-500 mb-6">The stack I actually use (not the LinkedIn cosplay version).</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {CORE_STACK.map((s) => (
          <span key={s} className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            {s}
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {skillGroups.map((g) => (
          <section key={g.id} className="rounded-xl bg-white dark:bg-[#2c2c2e] p-4 border border-black/5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{g.label}</h2>
            <ul className="space-y-2">
              {g.skills.map((s) => (
                <li key={s.name} className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                  {s.note && <span className="text-gray-500 text-xs block">{s.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
