---
slug: zaidos-portfolio
status: approved
intent: clear
review_required: false
pending-action: none - .omo/plans/zaidos-portfolio.md exists (48 todos + F1-F4, refined 2026-08-10: WM/workspaces consistency, Resend v4 route, switcher/taskbar visibility selector); awaiting user decision: start work or high-accuracy review
approach: Build "ZaidOS" - a full-immersive, Hyprland-rice-inspired web-desktop portfolio (React/Next.js 16 + Tailwind v4 + Motion + Zustand) that replaces zaidx.me, featuring a working terminal, hybrid chatbot, draggable/tiling windows, waybar, workspaces, games/easter eggs, ported articles, and a mobile fallback.
---

# Draft: zaidos-portfolio

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 Desktop shell | Boot screen, wallpaper engine, waybar, workspaces, desktop icons, context menu render and behave as spec'd on desktop + mobile-fallback | active | .omo/plans/zaidos-portfolio.md Todos wave 2
- C2 Window manager | Open/close/focus/min/maximize/drag/resize/tile via Zustand store; keyboard shortcuts work; state survives route changes | active | Todos wave 3
- C3 Apps | About, Projects, Skills, Experience, Resume, Contact, Articles, Settings, Terminal, Chatbot, Chess all open as windows with real content | active | Todos wave 4-6
- C4 Terminal + easter eggs | Custom shell interpreter answers every documented command; neofetch, matrix rain, cmatrix, fortune, sudo joke render | active | Todos wave 5
- C5 Chatbot | Scripted knowledge-base answers work offline; optional real-LLM mode toggles via env-gated API route | active | Todos wave 6
- C6 Content + SEO | Projects/skills/socials data files complete; 4 articles ported with same slugs; metadata/OG/sitemap/robots/JSON-LD/301 redirects | active | Todos wave 7
- C7 Mobile + a11y + perf | Dedicated mobile layout, keyboard nav, ARIA, reduced-motion, Lighthouse budgets met | active | Todos wave 8
- C8 Deploy + migration | Vercel deploy, zaidx.me DNS switch (whatbot.zaidx.me subdomain preserved), old-route redirects verified live, analytics | active | Todos wave 9

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
- assumption | adopted default | rationale | reversible?
- Terminal implementation | Custom React command interpreter, NOT xterm.js | Full visual control over the rice aesthetic, lighter bundle, no stale-dependency risk; a demo shell is sufficient | yes (swap to xterm.js later)
- Window management | Custom Zustand WM store + framer-motion drag; no react-rnd/dnd-kit | Matches Hyprland tiling behavior precisely; avoids dependency friction with React 19 | yes
- Framework | Next.js 16 (App Router, TS, Tailwind v4 via create-next-app@latest); Motion v12; lucide-react + custom SVG icons | SEO + article routes + env-gated API routes for chat/contact in one app; current stable 2026 stack | yes
- Hosting/domain | Vercel; apex + www zaidx.me pointed to Vercel; keep current Remix-on-Cloudflare untouched until DNS cutover verified | Standard for Next.js; whatbot.zaidx.me is a separate subdomain record and MUST stay live | yes
- Contact form | Next.js Route Handler using Resend when RESEND_API_KEY set, mailto fallback otherwise | No dead form if keys absent | yes
- Chat LLM mode | OpenAI-compatible route handler behind LLM_API_KEY + LLM_MODEL envs; scripted KB is the always-on default | Free/static default; real mode is opt-in by key | yes
- Test strategy | TDD for pure logic (WM store, shell parser, chatbot matcher) via Vitest; Playwright e2e smoke for desktop/boot/apps; tests-after for components | Zero-human verification required by workflow | yes
- Analytics | Vercel Web Analytics (no cookie banner) | Lightweight, privacy-friendly | yes
- Games/easter eggs scope | Chess mini-game (playable board), matrix rain (canvas), cmatrix, fortune, sudo joke, neofetch, boot sequence (skippable, cached) | Matches his stated love of chess + C++ games + ricing | yes
- Branding | Working title "ZaidOS"; accent #39FF14 (matrix green from his GitHub README); JetBrains Mono + Inter via next/font | Authentic to his existing identity | yes
- Profile photo reuse | Reuse /assets/Profile-YD56AsA9.jpg from current zaidx.me | Already his image | yes
- Resume | Resume app with print-to-PDF stylesheet; PDF download generated at build from content data | No resume asset exists publicly | yes

## Findings (cited - path:lines)
- zaidx.me is a Remix SPA hosted on Cloudflare (`window.__remixContext`, static.cloudflareinsights.com beacon, `/assets/*` hashed chunks); canonical + og:url are broken (`https://zaidxme` missing `.me`), og:image 404s, meta description is generic template copy ("product designer working on web & mobile apps...") - fetched raw HTML of https://zaidx.me
- Current site content = 6 featured projects (Applicator, Maktaba, Whatbot, Media Cleaner, PU Stacks, Zesho) + bio + articles nav + contact form (Name/Email/Subject/Message) + /uses page whose content is verbatim from hamishw.com's template (Sketch/After Effects/AE mentions are not his) - https://zaidx.me, https://zaidx.me/contact, https://zaidx.me/uses
- GitHub profile zaidx-me: 29 public repos incl. whatbot (TS), maktaba (TS), applicator-chrome (TS), zenith-build + zenith-build-refactored, linkedIn-Auto, movies-api (Vue), Tower-Defense (C++), Tank_Arena (C++), Media-Cleaner (Kotlin), books-app (Kotlin), RestaurantSim (C), ppt-maker, zesho, pustacks, zesho-web, zaidtech, hello-zaid, Nextjs, M-Zaid-Git.github.io; README opens with `┌─[zaid@archlinux]─[~/etc/passwd]`, accent #39FF14, CachyOS+Hyprland daily driver - https://github.com/Zaidx-me
- 4 published articles with working URLs: /articles/building-whatsapp-gateway, /articles/building-offline-urdu-reader, /articles/designing-university-courseware-platform, /articles/ai-job-application-assistant - https://zaidx.me/articles
- Products: whatbot.zaidx.me (live, WhatsApp gateway docs), applicator.netlify.app (live landing), kens.netlify.app (live client site), zanith-build.vercel.app returns 404 (dead) - fetched all
- Social handles: GitHub/LinkedIn = zaidx-me; Instagram/Threads/Snapchat = zaidxme; Twitter = zaidxme; Linktree = linktr.ee/zaidx.me; email NOT published anywhere found
- OS-portfolio landscape: macOS clones saturated (ekas-7/MAC-OS-Themed-Portfolio, markbrutx/portfolio2025, astro macos-portfolio-extended); Win98 common (React95, 98.css, os-gui, asanchezRay/portfolio-win98); terminal-only portfolios common (Terminal-portfolio, Portfolio-Terminal, termfolio); a Hyprland/Linux-rice web desktop as a PORTFOLIO is essentially open territory (only hyprland-website config explorer found) - web research 2026-08-10
- Current stack norms 2026: Next.js 16.3 (Turbopack default), Tailwind v4 (CSS-first @theme config), React 19, framer-motion v12 (motion package), create-next-app supports --tailwind --typescript --eslint --app; Vercel standard host - nextjs.org/docs + tailwindcss.com + dev.to (2026)
- zaidx.me OG/canonical currently broken; replacing the site is an SEO improvement, not just a redesign

## Decisions (with rationale)
- D1 CONCEPT: "ZaidOS" - a web desktop styled as a Hyprland/Arch rice (tiling+floating windows, gaps, rounded corners, blur, waybar, workspaces, rofi-style launcher, matrix-green accent) instead of macOS/Windows clone. Rationale: authentic to his daily driver (CachyOS+Hyprland) - his GitHub already opens with a zaid@archlinux terminal; differentiates in a saturated macOS-clone market; only the 4 owner-decisions below were asked (user approved all 4 recommendations).
- D2 CHATBOT: hybrid - scripted knowledge-base (free, static, offline) + optional real-LLM mode behind env keys (OpenAI-compatible route handler). User chose "Hybrid".
- D3 DOMAIN: replace zaidx.me; new site is the main identity. User chose "Replace zaidx.me".
- D4 DEPTH: full immersive (boot sequence, games, easter eggs, wallpapers, settings). User chose "Full immersive".
- D5 Fresh repo in /config/workspace/portfolio (currently empty, not a git repo) - git init at scaffold time; no legacy code to port except article content + profile photo from live site.
- D6 Keep whatbot.zaidx.me + applicator.netlify.app + kens.netlify.app untouched; zanith-build.vercel.app is dead (404) and shown as "archived" in Projects app.
- D7 Old routes /projects/:slug, /articles/:slug (same slugs), /contact, /uses get 301 redirects into the new app; humans.txt preserved.

## Scope IN
- ZaidOS desktop: boot screen (skippable, cached), wallpaper engine (>=4 wallpapers incl. animated matrix + gradient), waybar (workspaces, clock, tray, fake CPU/RAM), 5 workspaces, desktop icons + selection + right-click context menu, rofi-style launcher (Super/Mod+Space and click).
- Window manager: open/close/minimize-to-waybar/maximize/focus/drag/resize/snap-to-tile edges, z-order, Hyprland-style keybinds (Super+1..5, Super+Enter opens Terminal), window open/close animations, floating + manual tiling modes.
- Apps (windows): About, Projects (cards + detail view + live-demo + repo links + tags), Skills (grouped), Experience/Education, Resume (print-to-PDF), Contact (form + mailto fallback + socials), Articles (4 ported articles + list), Settings (wallpaper, accent color, blur toggle, animations toggle, reduce-motion), Terminal, Chatbot (ZaidGPT), Chess mini-game.
- Terminal commands: help, about, projects, skills, experience, contact, socials, neofetch, matrix, cmatrix, fortune, clear, echo, whoami, date, ls/cd (fake fs), sudo (joke), exit, open <app>.
- Easter eggs: matrix rain (canvas), cmatrix, neofetch ASCII (Arch logo), fortune (witty lines in his voice), sudo rm -rf joke, chess app.
- Content: all projects/skills/socials data from Findings; witty copy in his established voice (reuse GitHub README lines where fitting).
- SEO: metadata API per route, OG image via next/og (rice-styled), sitemap.xml, robots.txt, JSON-LD Person, canonical https://zaidx.me, 301 redirects for old routes, humans.txt.
- Mobile: dedicated touch layout - launcher drawer, scrollable app pages, same content, no desktop metaphors.
- a11y: keyboard navigation, focus management, ARIA on windows/launcher, prefers-reduced-motion respected (Settings also honors it), contrast >= 4.5:1.
- Performance: lazy-load apps (dynamic import), <150KB gzipped initial JS on landing route, Lighthouse >= 90 perf/accessibility on landing route.
- Deploy: Vercel project, env vars (RESEND_API_KEY, LLM_API_KEY, LLM_MODEL), domain cutover zaidx.me (preserve whatbot.zaidx.me record), post-deploy smoke tests, Vercel Web Analytics.
- Tests: Vitest unit (WM store, shell parser, chatbot matcher), Playwright e2e smoke (boot, open app, terminal command, chat, mobile viewport), agent-executed with evidence saved to .omo/evidence/.

## Scope OUT (Must NOT have)
- No macOS/Windows cloning; no xterm.js real terminal; no actual OS (no real filesystem/processes).
- No backend database; contact + chat use env-gated route handlers only.
- No payments, auth, admin panel, CMS.
- Do NOT touch whatbot.zaidx.me, applicator.netlify.app, kens.netlify.app, or any GitHub repo content; migration only for zaidx.me apex/www DNS.
- No photo-manipulation beyond cropping for OG/avatar reuse; reuse existing profile photo.
- No blog CMS or comments; articles are static content files.
- No audio/music player, no video autoplay.
- No copying other portfolios' code/assets; all visuals original or MIT-licensed libs (lucide-react, etc.).

## Open questions
- None blocking. Execution-time inputs (not planning forks): email address + RESEND_API_KEY for contact, LLM_API_KEY/LLM_MODEL for chat real mode, optional live wallpaper screenshots of his actual Hyprland rice for the wallpaper set, optional resume PDF. Defaults handle absence.

## Approval gate
status: awaiting-approval
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
