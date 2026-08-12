import OptimizedImage from "../../components/OptimizedImage.jsx";
import { site, projects, articles, socials } from "../content/index.ts";

export default function AboutApp() {
  return (
    <div className="mobile-app-scroll h-full w-full overflow-y-auto bg-[#f5f5f7] dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100">
      <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-2xl mx-auto pb-8">
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <OptimizedImage
            src="/images/profile.jpg"
            alt={site.owner}
            className="w-28 h-36 rounded-xl object-cover shadow-md"
            width={112}
            height={144}
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-semibold">{site.owner}</h1>
            <p className="text-sm text-green-600 dark:text-green-400 font-mono mt-1">{site.roleLine}</p>
            <p className="text-xs text-gray-500 mt-1">~{site.handle} · {site.siteUrl.replace("https://", "")}</p>
          </div>
        </header>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Bio</h2>
          {site.bio.map((p) => (
            <p key={p.slice(0, 24)} className="text-sm leading-relaxed mb-3">{p}</p>
          ))}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Quick stats</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3">
              <div className="text-xl font-semibold">{projects.length}</div>
              <div className="text-xs text-gray-500">Projects</div>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3">
              <div className="text-xl font-semibold">{articles.length}</div>
              <div className="text-xs text-gray-500">Articles</div>
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3">
              <div className="text-xl font-semibold">29</div>
              <div className="text-xs text-gray-500">GitHub repos</div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          {site.personalityChips.map((chip) => (
            <span key={chip} className="px-2 py-1 rounded-full text-xs bg-white/70 dark:bg-white/10">{chip}</span>
          ))}
        </section>

        <section className="flex gap-3">
          {socials.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {s.label}
            </a>
          ))}
        </section>
      </div>
    </div>
  );
}
