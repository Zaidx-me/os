# zaidos-portfolio - Work Plan

## TL;DR (For humans)

**What you'll get:** ZaidOS — a web desktop that looks and feels like your own Arch + Hyprland setup. Visitors boot into your OS, open app windows (About, Projects, Skills, Resume, Contact, Articles), use a working terminal with fun commands, chat with a ZaidGPT assistant, play chess, and find easter eggs (matrix rain, neofetch, jokes). It replaces zaidx.me and keeps whatbot, applicator, and kens untouched.

**Why this approach:** It's authentically YOU (you daily-drive CachyOS + Hyprland), and while macOS/Windows clone portfolios are everywhere, almost nobody has built a Linux-rice web desktop — so you stand out instantly. Everything runs in the browser; no real OS needed.

**What it will NOT do:** It is not an actual OS (no real terminal, no real system info — the CPU/RAM meter is a demo), has no login/database/admin, won't touch your other live products, and won't reuse the old template's copy.

**Effort:** XL
**Risk:** Medium - biggest risks are the DNS cutover (mitigated with a documented rollback that protects your whatbot subdomain) and the large build (mitigated by 9 sequential waves with tests at every step).
**Decisions to sanity-check:** (1) ZaidOS over a more familiar macOS clone; (2) a simulated terminal rather than a real one; (3) the contact email is a placeholder you'll need to replace; (4) the chatbot's "AI mode" needs your own API key to go live.

Your next move: say **start work** to begin execution, or **run a high-accuracy review** first. Full execution detail follows below.

---

> TL;DR (machine): XL effort / Medium risk — full-immersive Hyprland-rice web-desktop portfolio (48 todos, 9 waves) replacing zaidx.me, with terminal, hybrid chatbot, chess, mobile shell, SEO migration, and rollback-protected DNS cutover.

## Scope
### Must have
- **ZaidOS desktop shell**: skippable boot screen (cached in localStorage), wallpaper engine with >=4 wallpapers (animated matrix rain canvas, animated gradient, dark abstract, light variant), waybar (workspace indicators 1-5, live clock/date, system tray with fake CPU/RAM sparkline + uptime, launcher button), 5 workspaces, desktop icon grid with single-select/double-click-open, right-click context menu (Open Terminal, Change Wallpaper, About ZaidOS, Refresh joke, Reboot joke).
- **Window manager**: Zustand store (registry, open/close/focus/minimize/maximize, z-order, tile|float mode), window chrome (titlebar with app icon + title + minimize/maximize/close controls), pointer drag via titlebar, 8-direction resize handles, min sizes, viewport bounds clamp, edge-snap tiling (left/right/top) + keyboard tiling (Super+arrows), Hyprland-style keybindings (Super+Enter Terminal, Super+Space launcher, Super+1..5 workspaces, Super+Q close, Super+M minimize, Super+F toggle float, Super+Tab window cycle), open/close/focus animations via Motion.
- **Apps (each a window; content from data layer)**: About, Projects (cards + detail pane + live-demo/repo/article links + status badges), Skills (grouped: Mobile / Frontend / Backend / AI & DevTools / Design / Systems), Experience & Education (timeline), Resume (print-to-PDF), Contact (form -> POST /api/contact with Resend + mailto fallback, socials row, email copy), Articles (list + inline markdown reader), Settings (wallpaper picker, accent color picker, blur toggle, animations toggle, AI-chat toggle, About ZaidOS), Terminal, ZaidGPT chat, Chess.
- **Terminal (custom shell, NOT xterm.js)**: prompt `zaid@zaidos:~$`, command registry, typed output, shell history (up/down), tab completion, fake filesystem (ls/cd), unknown-command errors, commands: help, about, projects, skills, experience, contact, socials, whoami, date, echo, clear, exit, open <app>, ls, cd, sudo (joke), neofetch, matrix, cmatrix, fortune, cowsay (optional).
- **Easter eggs**: matrix rain canvas overlay (`matrix`/`cmatrix`), neofetch (Arch ASCII logo + system card with Hyprland/WM lines + color palette blocks), fortune (witty lines in Zaid's voice), `sudo rm -rf /` refusal joke, Chess mini-game (valid legal moves via chess.js, simple minimax AI depth 2 or hot-seat).
- **Hybrid chatbot ZaidGPT**: scripted knowledge-base engine (intent patterns -> answers with context injection, ~20 intents covering projects/skills/experience/contact/fun, fallback lines in his voice) + optional real-LLM mode via POST /api/chat (OpenAI-compatible: LLM_BASE_URL/LLM_API_KEY/LLM_MODEL env-gated, system prompt fed from data layer, graceful fallback to KB on error/timeout), chat UI with typing indicator + quick-reply chips + localStorage history, AI-mode toggle in Settings.
- **Content layer (all typed, single source of truth)**: projects.ts (12 entries: applicator, whatbot, maktaba, media-cleaner, pu-stacks, zesho, zenith-build[archived], tower-defense, tank-arena, movies-api, kens-sunrise[client], zaidtech[client] - each with title/description/stack/links/status), skills.ts, experience.ts, socials.ts, articles (4 ported with SAME slugs), chatbot KB, wallpapers config.
- **Articles + SEO**: 4 articles ported to content/articles/*.md with same slugs (building-whatsapp-gateway, building-offline-urdu-reader, designing-university-courseware-platform, ai-job-application-assistant); routes /articles and /articles/[slug] (SSR, per-route metadata); root metadata + canonical https://zaidx.me + OG image via next/og (rice-styled card); sitemap.xml; robots.txt; JSON-LD Person; favicon/manifest/apple-touch-icon; humans.txt preserved.
- **Redirects (next.config.js)**: /projects/:slug -> /?app=projects (301), /contact -> /?app=contact (301), /uses -> /?app=about (301), /articles/:slug preserved at same URL.
- **Mobile**: dedicated touch shell below lg breakpoint (or pointer-coarse): slim top bar (clock + app menu button), app-drawer launcher grid, apps open as full-screen stacked pages with back button; same content components; no desktop metaphors on touch.
- **a11y**: full keyboard nav, focus traps in windows/launcher/chat, visible focus rings, aria-labels on icon buttons, ARIA roles (dialog for windows, menubar for waybar, listbox for launcher), prefers-reduced-motion honored globally, WCAG AA contrast.
- **Performance**: all apps dynamically imported, terminal/matrix/chess/chatbot code-split, next/image for photos, self-hosted fonts via next/font, <150KB gzipped initial JS on landing route, Lighthouse >= 90 (perf + a11y) on landing.
- **Deploy**: Vercel project (git-connected), .env.example + documented env vars, domain cutover zaidx.me apex+www to Vercel (whatbot.zaidx.me subdomain record PRESERVED), post-deploy curl smoke, Vercel Web Analytics.
- **Tests**: Vitest unit (WM store, shell parser, chatbot matcher, data validation), Playwright e2e (boot, open app, terminal commands, chat KB + mocked LLM, mobile viewport, redirects), CI (GitHub Actions: lint + typecheck + test + build), evidence saved to .omo/evidence/.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO macOS/Windows desktop emulation; NO xterm.js or real PTY; NO actual OS (no real processes/filesystem/multiplayer).
- NO backend database, auth, payments, admin, CMS, or comment system; /api/contact and /api/chat are the only route handlers, both env-gated with graceful no-key fallbacks.
- DO NOT modify or redeploy whatbot.zaidx.me, applicator.netlify.app, kens.netlify.app, or any GitHub repo content; DNS work touches ONLY apex + www zaidx.me records.
- NO audio, no autoplaying video, no music player.
- NO copying other portfolios' code/assets; visual assets original or MIT-licensed (lucide-react, chess.js, react-markdown) or OFL-licensed fonts (JetBrains Mono, Inter).
- NO template boilerplate copy from the old site (the /uses template text and generic meta description must NOT be reused).
- NO rubber-band multi-select, no real window snap layouts beyond left/right/top, no multi-monitor virtual desktops.
- Do NOT build features "just because the OS has them" (file explorer, terminal multiplexing, notifications center) unless listed above.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for pure logic (WM store, shell parser, chatbot matcher, data validation) via Vitest; tests-after for UI components; Playwright e2e smoke for flows. Framework: Vitest + @testing-library/react + Playwright.
- Evidence: .omo/evidence/task-<N>-zaidos-portfolio.<ext> (no ulw-loop session in this workspace; use .omo/evidence/). Every todo records screenshots/console output/JSON for happy AND failure scenarios.
- Gates: `npm run lint` + `npm run typecheck` + `npx vitest run` + `npm run build` must pass after every todo; Playwright suite must pass at wave ends and in CI.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- **Wave 1 (Foundation, 5)**: scaffold repo, design tokens, data layer, fonts/icons, test harness + CI.
- **Wave 2 (Desktop shell, 6)**: boot, wallpapers, waybar, workspaces, desktop icons/context menu, launcher.
- **Wave 3 (Window manager, 5)**: WM store + hotkeys, window chrome, snap/tiling, app provider, taskbar + switcher.
- **Wave 4 (Core apps, 7)**: About, Projects, Skills, Experience, Resume, Contact, Articles app (parallelizable within wave).
- **Wave 5 (Terminal + easter eggs, 6)**: shell core, command content, neofetch, matrix/fortune easter eggs, chess, terminal e2e.
- **Wave 6 (Chatbot, 4)**: KB engine, chat UI, LLM route, chatbot e2e + Settings toggle.
- **Wave 7 (Content + SEO, 5)**: articles port, metadata/OG, sitemap/robots/JSON-LD/humans, redirects, SEO e2e + Lighthouse baseline.
- **Wave 8 (Mobile + a11y + perf, 5)**: mobile shell, keyboard/focus/a11y, reduced-motion/contrast, performance budget, mobile+a11y e2e.
- **Wave 9 (Deploy + migration, 5)**: Vercel project + envs, domain cutover, post-deploy verification, analytics + docs, final content/link sweep.
- Within waves 4-6, apps/features that only depend on Wave 1-3 artifacts can be built in parallel by subagents; each app todo is a self-contained unit.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 (scaffold) | - | all | - |
| 2 (tokens) | 1 | 6,7,8,10,13,17-48 | 3,4,5 |
| 3 (data) | 1 | 17-38, 44 | 2,4,5 |
| 4 (fonts/icons) | 1 | 13,17-48 | 2,3,5 |
| 5 (tests/CI) | 1 | all QA | 2,3,4 |
| 6 (boot) | 2 | 8,9,44-48 | 7 |
| 7 (wallpapers) | 2 | 18,32,45 | 6 |
| 8 (waybar) | 2,6 | 11,16,44-48 | 9,10 |
| 9 (workspaces) | 2,6 | 13,16,44-48 | 8,10 |
| 10 (desktop icons/menu) | 2 | 13,45 | 8,9 |
| 11 (launcher) | 2,8 | 13,16 | 9,10 |
| 12 (WM store+hotkeys) | 1,2 | 13-16,17-48 | - |
| 13 (window chrome) | 4,12 | 17-48 | 14,15,16 |
| 14 (snap/tiling) | 12 | 17-48 | 13,15,16 |
| 15 (app provider) | 4,12,13 | 17-48 | 14,16 |
| 16 (taskbar+switcher) | 8,12 | 17-48 | 13,14,15 |
| 17-23 (core apps) | 3,13,15 | 44-48 | each other (parallel) |
| 24-29 (terminal+easter eggs) | 3,13,15 | 44-48 | 30-33 (parallel) |
| 30-33 (chatbot) | 3,13,15 | 44-48 | 24-29 (parallel) |
| 34-38 (content+SEO) | 3,15 | 44-48 | 39-43 (parallel) |
| 39-43 (mobile+a11y+perf) | 2,3,4,13,15 | 44-48 | 34-38 (parallel) |
| 44-48 (deploy+migration) | all waves | F1-F4 | - |
| F1-F4 (final wave) | 44-48 | - | all four in parallel |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->

- [x] 1. Scaffold the Next.js 16 repo in /config/workspace/portfolio
  What to do / Must NOT do: Run `npx create-next-app@latest . --yes --force --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` — add `--force` because `.omo/` already exists in the workspace (create-next-app otherwise aborts with "The directory contains files that could conflict"); add `--yes` to skip interactive prompts in non-interactive shells; do NOT pass `--turbopack` (Turbopack is the default in Next 16 and newer create-next-app versions reject the flag as unknown). If `--force` is rejected by the installed version, scaffold into a temp subdir and move the generated files into the repo root, leaving `.omo/` untouched. Then `git init` (dir is NOT yet a git repo), create `src/` subfolders: `app/`, `components/`, `components/ui/`, `components/wm/`, `components/apps/`, `lib/`, `lib/shell/`, `lib/chat/`, `content/`, `content/articles/`, `hooks/`, `store/`, `styles/`, `test/`. Add npm scripts: `lint` (eslint .), `typecheck` (tsc --noEmit), `test:unit` (vitest run), `test:e2e` (playwright test). Verify .gitignore covers `.env`, `.env.local`, `.env*.local` (secrets/PII stay out of git); the .omo/ evidence dir MUST stay tracked. Before the initial commit: `mkdir -p .omo/evidence && touch .omo/evidence/.gitkeep` (git does not track empty dirs). MUST NOT install app dependencies beyond create-next-app output; MUST NOT create product code yet.
  Parallelization: Wave 1 | Blocked by: - | Blocks: all todos
  References (executor has NO interview context - be exhaustive): create-next-app CLI flags https://nextjs.org/docs/app/api-reference/cli/create-next-app ; workspace /config/workspace/portfolio contains ONLY the `.omo/` dir (plans/drafts/run-continuation), verified 2026-08-10 - NOT empty, so `--force` is required; draft decisions D5 + stack defaults in .omo/drafts/zaidos-portfolio.md
  Acceptance criteria (agent-executable): `npm run build` exits 0; `npx tsc --noEmit` exits 0; `git status` clean after initial commit; all dirs above exist; `git check-ignore .env.local` exits 0.
  QA scenarios (name the exact tool + invocation): happy: `npm run dev` in background then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` = 200. failure: delete a brace in src/app/layout.tsx -> `npx tsc --noEmit` exits non-zero (proves typecheck wired). Evidence .omo/evidence/task-1-zaidos-portfolio.txt
  Commit: Y | chore(repo): scaffold Next.js 16 app with lint/typecheck/test scripts

- [x] 2. Design tokens + global styles (Tailwind v4 CSS-first)
  What to do / Must NOT do: In src/styles/globals.css: `@import "tailwindcss";` + `@theme { ... }` defining: --color-zaid-bg #0a0c10, --color-zaid-surface #12141c, --color-zaid-surface2 #1a1e2a, --color-zaid-border #2a2f3d, --color-zaid-text #e6e9ef, --color-zaid-muted #8b93a7, --color-zaid-accent #39FF14, --color-zaid-accent2 #22d3ee, --color-zaid-danger #ef4444, --font-mono "JetBrains Mono", --font-sans "Inter", --radius-window 0.75rem, --gap-window 0.5rem, --waybar-h 2.5rem. Base layer: body bg --color-zaid-bg, text --color-zaid-text. Utilities: window glass (color-mix surface 72% + backdrop-filter blur(16px)), hairline borders, custom scrollbar, selection color accent. Replace default globals, link from root layout. MUST NOT define colors outside tokens.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 6,7,8,10,13,17-48
  References (executor has NO interview context - be exhaustive): Tailwind v4 theme https://tailwindcss.com/docs/theme ; Next install guide https://tailwindcss.com/docs/installation/framework-guides/nextjs ; token values from draft Open-assumptions branding row + plan Scope
  Acceptance criteria (agent-executable): `npm run build` passes; grep src/styles/globals.css shows `@theme` and `--color-zaid-accent: #39FF14`.
  QA scenarios (name the exact tool + invocation): happy: Playwright asserts getComputedStyle(document.body).backgroundColor === 'rgb(10, 12, 16)'. failure: class `bg-zaid-nope` (nonexistent token) computes to no background change - proves only tokenized utilities exist. Evidence .omo/evidence/task-2-zaidos-portfolio.txt
  Commit: Y | style(tokens): add Tailwind v4 design tokens and global rice styles

- [x] 3. Typed content data layer
  What to do / Must NOT do: Create under src/content/: `projects.ts` (12 entries: applicator, whatbot, maktaba, media-cleaner, pu-stacks, zesho, zenith-build, tower-defense, tank-arena, movies-api, kens-sunrise, zaidtech; fields id, title, tagline, description, stack[], links{live?, repo?, article?, figma?}, status: live|open-source|archived|client|in-progress, featured), `skills.ts` (groups: Mobile, Frontend, Backend, AI & DevTools, Design, Systems), `experience.ts` (BSIT 4th sem University of the Punjab Gujranwala; Graphic Design Intern Tech Bridge Consultancy; Freelance mobile+Shopify dev; periods marked current where ongoing; bullets factual from Findings only), `socials.ts` (GitHub zaidx-me, LinkedIn zaidx-me, Instagram/Threads/Snapchat/Twitter zaidxme, Linktree linktr.ee/zaidx.me), `site.ts` (name "ZaidOS", owner "Muhammad Zaid Yaseen", handle zaidx, accent #39FF14, bio in HIS voice from zaidx.me home + GitHub README personality lines, personality chips: chess London System / MMA / Urdu poetry / CachyOS+Hyprland ricing / C++ SFML games, contactEmail placeholder "hello@zaidx.me" flagged TODO), `wallpapers.ts` (>=4: animated-matrix, animated-gradient, dark-abstract, light-minimal), `articles.ts` (4 slugs + titles + descriptions from zaidx.me). Add `src/content/validation.ts` (validators: unique ids, required links per status, valid status enum) + `validation.test.ts`. MUST NOT invent facts beyond Findings; zenith-build status=archived (live URL 404s); kens-sunrise + zaidtech status=client.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 17-38, 44
  References (executor has NO interview context - be exhaustive): project facts https://zaidx.me + https://github.com/Zaidx-me?tab=repositories ; live URLs https://whatbot.zaidx.me https://applicator.netlify.app https://kens.netlify.app https://zanith-build.vercel.app (404 -> archived); articles https://zaidx.me/articles
  Acceptance criteria (agent-executable): `npx vitest run src/content/validation.test.ts` passes; `npx tsc --noEmit` passes; every appId referenced later exists in projects.ts.
  QA scenarios (name the exact tool + invocation): happy: validation passes for all 12 projects. failure: temporarily add duplicate project id -> test fails (validator runs). Evidence .omo/evidence/task-3-zaidos-portfolio.txt
  Commit: Y | feat(content): typed data layer for projects, skills, socials, wallpapers, articles

- [x] 4. Fonts + icon system
  What to do / Must NOT do: next/font/google `JetBrains_Mono` (400,500,700) + `Inter` (400,500,700) in src/app/layout.tsx, CSS vars --font-mono/--font-sans; font-mono on terminal/waybar/launcher. NOTE: next/font/google downloads at build time — if the build environment is offline, download the woff2 files once and self-host via `next/font/local` (document which files were used). Install `lucide-react`. Create src/components/ui/AppIcon.tsx: rice-style SVG per appId (about, projects, skills, experience, resume, contact, articles, settings, terminal, chat, chess) using currentColor + src/components/ui/Icon.tsx lucide wrapper. Create src/app/icon.svg + apple-icon.png (ZaidOS mark: dark rounded square, green terminal prompt glyph). MUST NOT use emoji as app icons.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 13,17-48
  References (executor has NO interview context - be exhaustive): next/font https://nextjs.org/docs/app/building-your-application/optimizing/fonts ; lucide https://lucide.dev ; icon.svg conventions https://nextjs.org/docs/app/api-reference/file-conventions/metadata-files/app-icons
  Acceptance criteria (agent-executable): `npm run build` passes; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/icon.svg` = 200; AppIcon renders all 11 appIds without throwing.
  QA scenarios (name the exact tool + invocation): happy: test asserts AppIcon("terminal") renders <svg aria-label="Terminal">. failure: AppIcon("unknown-id") returns deterministic fallback icon, no throw. Evidence .omo/evidence/task-4-zaidos-portfolio.txt
  Commit: Y | feat(ui): add fonts, lucide wrapper, and custom app icon set

- [x] 5. Test harness + CI pipeline
  What to do / Must NOT do: Dev deps: vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @playwright/test, @axe-core/playwright. vitest.config.ts (jsdom, globals, setupFiles src/test/setup.ts). playwright.config.ts: projects desktop (chromium 1440x900) + mobile (390x844), baseURL http://localhost:3000, webServer { command: 'npm run dev', reuseExistingServer: true } (an already-running dev server on 3000 is reused instead of failing the run). `npx playwright install chromium`. .github/workflows/ci.yml: on push/PR -> lint, typecheck, vitest, build, playwright (cache browsers). First smoke test src/test/smoke.test.tsx asserting landing renders. MUST NOT put e2e in npm `test` script; MUST NOT run e2e without build in CI.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: all QA across waves
  References (executor has NO interview context - be exhaustive): Vitest https://vitest.dev/guide/ ; Playwright https://playwright.dev/docs/intro ; GitHub Actions https://docs.github.com/en/actions
  Acceptance criteria (agent-executable): `npm run test:unit` passes; `npx playwright test` passes (smoke); .github/workflows/ci.yml valid YAML.
  QA scenarios (name the exact tool + invocation): happy: unit + desktop Playwright smoke green. failure: deliberate failing assertion in smoke.test.tsx -> `npx playwright test` exits non-zero. Evidence .omo/evidence/task-5-zaidos-portfolio.txt
  Commit: Y | chore(ci): add Vitest + Playwright harness and CI pipeline

- [x] 6. Boot sequence screen
  What to do / Must NOT do: src/store/boot.ts (zustand persist) + src/components/wm/BootScreen.tsx: first visit -> full-screen boot: "ZaidOS" logo, typed systemd-style logs ([ OK ] Started ZaidOS - the only OS cooler than your window manager / [ OK ] Mounted /dev/zaid on /home / [ OK ] Started Hyprland.web compositor), progress bar, auto-continue ~4s or any key/click skips; fade to desktop. localStorage `booted` skips on return (quick fade only). MUST NOT autoplay audio; MUST respect prefers-reduced-motion (instant, no animation). SSR hydration: BootScreen AND the whole desktop shell render behind a single `if (!mounted) return null` gate (useEffect) — every browser-only read (localStorage, matchMedia, innerWidth, ResizeObserver) happens after `mounted` flips; persisted stores (boot/wallpaper/settings/chat) are applied post-mount to avoid hydration mismatches.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 8,9,44-48
  References (executor has NO interview context - be exhaustive): zustand persist https://zustand-docs.pmnd.rs/integrations/persisting-store-data ; Motion https://motion.dev/docs/react
  Acceptance criteria (agent-executable): Playwright: fresh context -> [data-testid="boot-screen"] within 2s; Enter -> desktop visible; reload -> no boot screen (localStorage skip). Pass.
  QA scenarios (name the exact tool + invocation): happy: boot -> [data-testid="desktop"] transition completes. failure: `page.emulateMedia({ reducedMotion: 'reduce' })` -> boot renders instantly, no timeout. Evidence .omo/evidence/task-6-zaidos-portfolio.txt
  Commit: Y | feat(boot): add skippable boot sequence with localStorage persistence

- [x] 7. Wallpaper engine
  What to do / Must NOT do: src/store/wallpaper.ts (zustand persist) + src/components/wm/Wallpaper.tsx: renders active wallpaper behind windows. Types: `matrix` (canvas green rain ~30fps, pauses when tab hidden), `gradient` (CSS animated hue shift; static under reduced-motion), `dark` (static abstract SVG), `light` (light variant). Crossfade on change. src/components/wm/MatrixRain.tsx reusable canvas (also used by terminal `matrix`). MUST NOT load wallpapers from network; locally generated only; cap rAF loop with frame skip.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 18,32,45
  References (executor has NO interview context - be exhaustive): Canvas 2D https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D ; matrix rain = ORIGINAL implementation, no copied code
  Acceptance criteria (agent-executable): Playwright: [data-testid="wallpaper"] present; store action changes its data-theme attribute; matrix canvas has alpha>0 pixels after ~1s (getImageData). Pass.
  QA scenarios (name the exact tool + invocation): happy: matrix wallpaper draws green pixels. failure: reduced-motion -> matrix renders a single static frame (frame-counter stub shows no loop). Evidence .omo/evidence/task-7-zaidos-portfolio.txt
  Commit: Y | feat(desktop): wallpaper engine with matrix/gradient/static variants

- [x] 8. Waybar (top bar)
  What to do / Must NOT do: src/components/wm/Waybar.tsx: fixed top bar height 2.5rem glass blur. Left: launcher button + 5 workspace pills (active = accent; click switches; tooltip names term/proj/web/soc/game). Right: live clock (updates/min) + date, tray with fake CPU%/RAM% canvas sparkline (oscillating demo values - must never sit stuck at 0%/100%; comment "demo values, not real metrics"), uptime (session), GitHub + LinkedIn icon links, power button -> shutdown easter-egg dialog (Reboot replay boot / Cancel / Log out anim). Hidden on mobile. MUST NOT read real system metrics.
  Parallelization: Wave 2 | Blocked by: 2,6 | Blocks: 11,16,44-48
  References (executor has NO interview context - be exhaustive): workspace store (todo 9) for pills; tokens --waybar-h; lucide icons; window taskbar integration is todo 16
  Acceptance criteria (agent-executable): Playwright: [data-testid="waybar"] visible on desktop; clicking pill 3 sets active workspace 3 (assert pill class); clock matches system time ±1min. Pass.
  QA scenarios (name the exact tool + invocation): happy: 5 pills render, click switches workspace. failure: tray CPU always parsed as integer 0-100 (asserts no real metric leak). Evidence .omo/evidence/task-8-zaidos-portfolio.txt
  Commit: Y | feat(desktop): add waybar with workspaces, clock, and demo system tray

- [x] 9. Workspace system (5 workspaces)
  What to do / Must NOT do: src/store/workspaces.ts (zustand): 5 workspaces ids 1-5 labels term/proj/web/soc/game; each = ordered window-id list + focused id. Actions: openInWorkspace(appId, ws?), closeWindow(id), moveWindow(id, ws), focusNextInWs(ws), setActive(ws). src/components/wm/WorkspaceView.tsx renders active workspace windows. Super+1..5 switch (hotkeys todo 12). Empty workspace shows hint "Nothing here yet. Press Super+Space". MUST NOT allow window in 2 workspaces; close removes only from owning ws. **workspaces.ts is the ONLY source of truth for workspace membership** — `wm.ts` window objects have NO `workspace` field (todo 12). All membership mutation goes through the orchestrators in `lib/wm/actions.ts` (`openApp`, `moveWindowToWorkspace`) so both stores update in one synchronous handler. **Never persist workspaces.ts** (session-only; a persisted desktop session would restore windows off-screen on smaller viewports).
  Parallelization: Wave 2 | Blocked by: 2,6 | Blocks: 13,16,44-48
  References (executor has NO interview context - be exhaustive): zustand; interacts with wm.ts (todo 12); Hyprland-like workspace semantics
  Acceptance criteria (agent-executable): Vitest: invariants (window in exactly one ws; close removes from owning ws; focus falls to next). All pass.
  QA scenarios (name the exact tool + invocation): happy: open in ws1, switch ws3, back -> window persists. failure: empty ws shows hint; close focused -> focus moves to remaining window. Evidence .omo/evidence/task-9-zaidos-portfolio.txt
  Commit: Y | feat(desktop): 5-workspace model with focus and move semantics

- [x] 10. Desktop icons + right-click context menu
  What to do / Must NOT do: src/components/wm/DesktopIcons.tsx: icon grid (11 apps, selectable), single-click select (accent ring), double-click open, Enter opens selected. src/components/wm/ContextMenu.tsx: desktop right-click menu: Open Terminal, Change Wallpaper (4 submenu), Refresh (icons spin), About ZaidOS (opens Settings), Reboot (replay boot), Shut down (joke dialog + power-off anim). Close on click-away/ESC. MUST NOT show native context menu on desktop (preventDefault desktop-only); right-click inside windows does NOT open desktop menu.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: 13,45
  References (executor has NO interview context - be exhaustive): appIds (todo 15 registry), wallpaper store (7), wm store (12)
  Acceptance criteria (agent-executable): Playwright: double-click Projects icon -> window-projects visible; right-click desktop -> menu visible; "Open Terminal" opens terminal. Pass.
  QA scenarios (name the exact tool + invocation): happy: double-click opens app; menu items work. failure: right-click inside an open window -> no desktop menu. Evidence .omo/evidence/task-10-zaidos-portfolio.txt
  Commit: Y | feat(desktop): desktop icons with select/open and context menu

- [x] 11. Rofi-style app launcher (Super+Space)
  What to do / Must NOT do: src/components/wm/Launcher.tsx: centered glass panel, input, fuzzy search over apps (name/keywords) + commands ("open terminal", "matrix"), ArrowUp/Down + Enter + ESC, click-away closes, Mod+Space toggles, empty query = all apps grid. Modal (blocks window input while open). Fuzzy = simple subsequence scorer, no new dep. MUST NOT open while typing in terminal/inputs; launcher stops propagation.
  Parallelization: Wave 2 | Blocked by: 2,8 | Blocks: 13,16
  References (executor has NO interview context - be exhaustive): hotkey service (todo 12); command names from shell (todo 25)
  Acceptance criteria (agent-executable): Playwright: Mod+Space opens launcher; type "term" -> Terminal first; Enter opens terminal window; ESC closes. Pass.
  QA scenarios (name the exact tool + invocation): happy: "chess" launches chess app. failure: typing in launcher does not leak keystrokes to focused window (assert document.activeElement stays launcher input). Evidence .omo/evidence/task-11-zaidos-portfolio.txt
  Commit: Y | feat(desktop): fuzzy app/command launcher with keyboard nav

- [x] 12. Window manager store + hotkey service
  What to do / Must NOT do: src/store/wm.ts (zustand): per-window { id, appId, title, x, y, w, h, z, minimized, maximized, mode: tile|float } — NO `workspace` field (membership lives ONLY in workspaces.ts, todo 9); actions open/close/focus/minimize/toggleMaximize/setBounds/setMode; z monotonic; focusing raises z BUT focus/raise only ever applies within the ACTIVE workspace — focus() refuses windows whose workspace != active ws (no cross-workspace raising; Mod+Tab cycles within the active workspace only). Add `src/lib/wm/actions.ts` orchestrators: `openApp(appId)` = workspaces.openInWorkspace(...) THEN wm.open(...); `moveWindowToWorkspace(id, ws)` = workspaces.moveWindow + wm.setBounds/raise — both store mutations happen in the SAME synchronous handler (React 19 batches into one commit; a component may never call one store's mutator without the other's in the same handler; the todo 14 hotkey calls the orchestrator, never a raw store action). setBounds clamps are viewport-capped: `w = clamp(w, Math.min(360, vw-16), vw-16)`, `h = clamp(h, Math.min(240, vh-WAYBAR_H-16), vh-WAYBAR_H-16)` — applied in setBounds, in open() (defaultSize), in snap/tile math (todo 14), and re-clamped from a root ResizeObserver on viewport change. **Never persist wm.ts** (session-only). src/lib/hotkeys.ts: global keydown, ignored when target is input/textarea/contentEditable OR modal open (launcher/context dialogs block): Mod+Enter terminal, Mod+Space launcher, Mod+1..5 workspace, Mod+Q close, Mod+M minimize, Mod+ArrowLeft/Right move ws, Mod+F toggle float, Mod+Tab cycle windows. Mod = Meta on Mac, Ctrl+Alt elsewhere (documented in Settings). MUST NOT duplicate listeners on HMR (module guard).
  Parallelization: Wave 3 | Blocked by: 1,2 | Blocks: 13-16,17-48
  References (executor has NO interview context - be exhaustive): zustand; Pointer/Keyboard events MDN; Interaction with workspaces store (todo 9)
  Acceptance criteria (agent-executable): Vitest: open/close/focus raises z; minimize preserves state; toggleMaximize toggles; setBounds clamps to min 360x240 AND viewport-caps the min on small viewports (setBounds(100,100) on a 200x200 viewport yields a fitting rect, not 360x240); hotkey map resolves Mod+1..5. Pass.
  QA scenarios (name the exact tool + invocation): happy: focus twice doesn't grow z unbounded. failure: closing focused window focuses next-highest (no dangling focus). Evidence .omo/evidence/task-12-zaidos-portfolio.txt
  Commit: Y | feat(wm): window store with z-order and global hotkey service

- [ ] 13. Window chrome component (drag/resize/min/max/close)
  What to do / Must NOT do: src/components/wm/Window.tsx: titlebar (AppIcon + title + controls minimize/maximize/close, rice-style square buttons) + content area. Drag = manual pointer math on titlebar (pointer capture, clamp to viewport minus waybar, 40px edge zone triggers tile preview from todo 14). Resize = 8 invisible handles (cursor styles), min 360x240. Motion: open scale 0.96->1 + fade 200ms, close reverse, focus z+highlight, maximize fills workspace minus waybar+gaps. Double-click title toggles maximize. Close restores focus to previous window. MUST NOT drag while maximized (restore first); MUST NOT use framer-motion drag (manual pointer keeps tiling deterministic).
  Parallelization: Wave 3 | Blocked by: 4,12 | Blocks: 17-48
  References (executor has NO interview context - be exhaustive): Pointer events https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events ; Motion https://motion.dev/docs/react
  Acceptance criteria (agent-executable): Playwright: drag titlebar changes x/y; maximize fills workspace minus waybar; minimize hides (aria-hidden) + task appears; close removes; SE-resize grows w/h; double-click title maximizes. Pass.
  QA scenarios (name the exact tool + invocation): happy: drag beyond top clamps at waybar height. failure: maximize then drag -> no position change. Evidence .omo/evidence/task-13-zaidos-portfolio.txt
  Commit: Y | feat(wm): window chrome with drag, resize, and window controls

- [ ] 14. Edge-snap tiling + keyboard tiling
  What to do / Must NOT do: Snap preview overlay (left half / right half / full, glass panel); drop -> mode=tile with exact bounds (gutter 8px; x=gap, y=waybar+gap, w=50%-gap/2). Keyboard: Mod+Left/Right/Up tile half/quarter, Mod+F float toggle (restores prior bounds), Mod+Shift+Left/Right move workspace — the move calls the `moveWindowToWorkspace` orchestrator (lib/wm/actions.ts), never a raw store action. Tile math uses the viewport-capped clamps from todo 12. No cascade/auto-tiling of new windows (windows open floating; user snaps) - scope boundary. Animate tile transitions. MUST NOT auto-tile on open, MUST NOT implement full Hyprland layouts.
  Parallelization: Wave 3 | Blocked by: 12 | Blocks: 17-48
  References (executor has NO interview context - be exhaustive): tokens gap; wm.ts setBounds/setMode; snap math exact: x=8, y=40+8, w=calc(50% - 12px)
  Acceptance criteria (agent-executable): Playwright: drag window to left edge -> snapped x≈8 w≈50%-12px; second to right -> side-by-side; Mod+Left tiles floating window; Mod+F restores prior bounds. Pass.
  QA scenarios (name the exact tool + invocation): happy: snap bounds within ±2px of math. failure: drop NOT near edge (<40px) keeps drag position (no accidental snap). Evidence .omo/evidence/task-14-zaidos-portfolio.txt
  Commit: Y | feat(wm): edge-snap and keyboard tiling with float toggle

- [ ] 15. App registry + window content provider
  What to do / Must NOT do: src/lib/apps.tsx: registry appId -> { title, icon, keywords, component: React.lazy(() => import('@/components/apps/<App>')), defaultSize, defaultWorkspace? } for 11 apps. src/components/wm/WindowHost.tsx: Suspense-wraps lazy app, passes { windowId, close, minimize, maximize, setTitle }. MUST NOT statically import app components in host; dynamic import required for code-splitting.
  Parallelization: Wave 3 | Blocked by: 4,12,13 | Blocks: 17-48
  References (executor has NO interview context - be exhaustive): React.lazy https://react.dev/reference/react/lazy ; AppIcon (todo 4)
  Acceptance criteria (agent-executable): Vitest: registry has exactly 11 appIds; each lazy import resolves. Playwright: opening each app from launcher renders [data-testid="window-<appId>"]. Pass.
  QA scenarios (name the exact tool + invocation): happy: all 11 apps open with no console errors. failure: unknown appId throws clear error; test asserts throw. Evidence .omo/evidence/task-15-zaidos-portfolio.txt
  Commit: Y | feat(wm): lazy app registry and window host

- [ ] 16. Waybar taskbar + window switcher overlay
  What to do / Must NOT do: Waybar task section: open windows per current workspace (icon + truncated title); click focuses/restores, click focused -> minimize (toggle); minimized dimmed. src/components/wm/Switcher.tsx: Mod+Tab overlay listing ONLY active-workspace windows (excludes minimized), sorted by z desc, with icon+title; Arrows+Enter select, ESC dismiss; respects modal focus. MUST NOT use native Alt+Tab; Mod+Tab only. WorkspaceView, waybar taskbar, switcher, and close-focus-fallback all import ONE selector from `lib/wm/selectors.ts`: `isVisible(winId) = workspaces.activeWs.list.includes(winId) && !wm.windows[winId]?.minimized` — no component computes visibility itself.
  Parallelization: Wave 3 | Blocked by: 8,12 | Blocks: 17-48
  References (executor has NO interview context - be exhaustive): workspaces (9), wm (12), Waybar (8)
  Acceptance criteria (agent-executable): Playwright: 2 windows -> both in tasks; click background task focuses; Mod+Tab opens switcher; Enter selects. Pass.
  QA scenarios (name the exact tool + invocation): happy: minimized window restores via task click. failure: click focused task minimizes (toggle) - assert hidden. Evidence .omo/evidence/task-16-zaidos-portfolio.txt
  Commit: Y | feat(wm): waybar taskbar toggle and window switcher overlay

- [ ] 17. About app
  What to do / Must NOT do: src/components/apps/AboutApp.tsx: header (photo via next/image from public/images/profile.jpg - download from https://zaidx.me/assets/Profile-YD56AsA9.jpg at implementation - MUST use a browser-like User-Agent (hotlink protection possible) and verify the download is a real image (file signature + dimensions, not an HTML/403 page); download MUST happen BEFORE the DNS cutover in todo 45 because the old Cloudflare site may be unreachable afterward; name "Muhammad Zaid Yaseen"; role line "Developer · Programmer · Engineer · Designer · Modder"), bio from content/site.ts (reuse his personal zaidx.me home bio "I'm Zaid, an IT student..." + GitHub README personality lines - sanity-check the homepage bio is genuinely his own writing and NOT template boilerplate before reuse; MUST NOT reuse the /uses template text or generic template meta description), personality chips (Chess - London System, MMA, Urdu poetry, CachyOS + Hyprland ricing, C++/SFML games), quick stats (projects count from data, 29 repos, 4 articles). Scrollable content area. MUST NOT include the old template's /uses content.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): bio+photo https://zaidx.me ; personality https://github.com/Zaidx-me README ; content/site.ts (todo 3)
  Acceptance criteria (agent-executable): Playwright: open About -> name, role line, >=3 chips render; image has src=/images/profile.jpg. Pass.
  QA scenarios (name the exact tool + invocation): happy: all sections visible. failure: assert no string from the old template meta description appears in About DOM. Evidence .omo/evidence/task-17-zaidos-portfolio.txt
  Commit: Y | feat(apps): About window with bio, photo, and personality chips

- [ ] 18. Projects app
  What to do / Must NOT do: src/components/apps/ProjectsApp.tsx: card grid from content/projects.ts (icon, title, tagline, stack tags, status badge live|open-source|client|archived|in-progress); click -> detail pane (description, stack, links Live demo/Repo/Article with rel noopener new tabs). Filters: All / Live / Open source / Client / Archived. Featured first. zenith-build detail shows note "Deployed site is archived (404)". kens-sunrise + zaidtech labeled Client work. Footer: "More on GitHub" -> https://github.com/Zaidx-me?tab=repositories. MUST NOT display dead link zanith-build live URL as active; MUST NOT invent project descriptions beyond Findings.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): content/projects.ts; live URLs verified 2026-08-10 (whatbot/applicator/kens 200, zanith-build 404)
  Acceptance criteria (agent-executable): Playwright: open Projects -> >=12 cards; filter Archived -> zenith-build visible; click card -> detail shows stack + links with correct hrefs. Pass.
  QA scenarios (name the exact tool + invocation): happy: link hrefs match data (repo->https://github.com/Zaidx-me/<repo>). failure: filter Live -> archived card absent. Evidence .omo/evidence/task-18-zaidos-portfolio.txt
  Commit: Y | feat(apps): Projects window with cards, filters, and detail pane

- [ ] 19. Skills app
  What to do / Must NOT do: src/components/apps/SkillsApp.tsx: grouped skill chips (Mobile, Frontend, Backend, AI & DevTools, Design, Systems) from content/skills.ts; each chip = lucide icon + name + one-line note. Section "the stack I actually use (not the LinkedIn cosplay version)" with his README list: React Native, TypeScript, Node.js, Python, C++, FastAPI, Docker, Arch, Hyprland. Optional animated level bars MUST be labeled "vibes, not metrics". MUST NOT show fake percentages without that disclaimer.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): skills facts https://github.com/Zaidx-me + zaidx.me home tags; content/skills.ts
  Acceptance criteria (agent-executable): Playwright: open Skills -> all 6 groups render; each has >=1 chip; disclaimer present if bars used. Pass.
  QA scenarios (name the exact tool + invocation): happy: React Native + Hyprland present. failure: no empty groups (each group has chips). Evidence .omo/evidence/task-19-zaidos-portfolio.txt
  Commit: Y | feat(apps): Skills window grouped by domain with disclaimer

- [ ] 20. Experience & Education app
  What to do / Must NOT do: src/components/apps/ExperienceApp.tsx: timeline entries from content/experience.ts: Education (BSIT, 4th semester, University of the Punjab - Gujranwala, current), Work (Graphic Design Intern, Tech Bridge Consultancy; Freelance Mobile (React Native) + Shopify developer, current), Side projects (whatbot, applicator highlights). Each: role, org, period, 2-3 factual bullets. MUST NOT invent employers, dates, or achievements beyond Findings.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): zaidx.me home bio ("currently working as a mobile and Shopify developer", "Graphic Design Intern at Tech Bridge Consultancy", "Information Technology student at the University of the Punjab")
  Acceptance criteria (agent-executable): Playwright: open Experience -> timeline shows >=3 entries incl. BSIT + Tech Bridge; education labeled. Pass.
  QA scenarios (name the exact tool + invocation): happy: all entries render factual org names. failure: unknown date renders as "—" not "undefined". Evidence .omo/evidence/task-20-zaidos-portfolio.txt
  Commit: Y | feat(apps): Experience & Education timeline window

- [ ] 21. Resume app
  What to do / Must NOT do: src/components/apps/ResumeApp.tsx: one-page resume rendered from data layer (header, contact row, summary, skills, experience, education, projects highlights). "Download PDF" -> window.print() with @media print stylesheet that hides waybar/windows/desktop and prints only resume; also link to public/resume/zaid-resume.pdf IF user adds it later (button falls back to print when absent). MUST NOT ship a fake/hand-written PDF; print is the delivery.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): content data (3,20); print CSS patterns https://developer.mozilla.org/en-US/docs/Web/CSS/@media/print
  Acceptance criteria (agent-executable): Playwright: open Resume -> name + sections render; click Download PDF -> window.print called (stub via page.on('dialog') or evaluate override). Pass.
  QA scenarios (name the exact tool + invocation): happy: print button triggers print event. failure: with media print emulation, resume container visible and desktop chrome display:none (assert computed display). Evidence .omo/evidence/task-21-zaidos-portfolio.txt
  Commit: Y | feat(apps): Resume window with print-to-PDF stylesheet

- [ ] 22. Contact app + /api/contact
  What to do / Must NOT do: src/components/apps/ContactApp.tsx: form name/email/subject/message (validation: required, email regex), POST /api/contact; success state (green "Message sent - I'll reply soon"); error state + hint. src/app/api/contact/route.ts: if RESEND_API_KEY && CONTACT_TO_EMAIL -> send via Resend SDK v4 (`import { Resend } from 'resend'; const resend = new Resend(process.env.RESEND_API_KEY); const { data, error } = await resend.emails.send({...})` — v4 returns {data,error} and does NOT throw, so CHECK `error`); From defaults to `'ZaidOS <onboarding@resend.dev>'` (free-tier delivers only to the account-owner address, which IS CONTACT_TO_EMAIL — zero-config), with optional `RESEND_FROM` env override (upgrade path = verify the zaidx.me sending domain in Resend, which adds DNS records to the SAME Cloudflare zone as todo 45 — document this, do NOT do it automatically); else 501 { message: "mailto" }; DEMO-GRADE in-memory rate limit 5/min/IP -> 429 (label it 'per-instance, not a security control'); read IP via `cf-connecting-ip` ?? `x-vercel-forwarded-for` ?? 'anon' (plain x-forwarded-for first value is spoofable); add a hidden honeypot input `website` — if filled, return 200 {ok:true} without sending. Client: if 501 or network error -> open mailto: with composed subject/body; if 429 -> show "You're sending too fast — wait a moment" (NOT mailto, which bypasses the rate limit). Socials row (icons + labels from content/socials.ts) + "copy email" button (navigator.clipboard). Email value from content/site.ts contactEmail placeholder; the REAL contact email is PII: server reads it from env CONTACT_TO_EMAIL only (never hardcoded in code/data), never log it, render it client-side only. MUST NOT store messages in a DB; MUST NOT log message bodies.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): Resend API https://resend.com/docs/api-reference/emails/send-email ; contact form fields from https://zaidx.me/contact
  Acceptance criteria (agent-executable): Playwright: submit empty form -> validation errors; fill valid -> success state (route intercepted to 200 JSON ok). API unit: with no env keys route returns 501; with mocked keys calls Resend (nock/vi.mock). PII gate: once the real email is known, `git grep -n '<real-email>'` returns zero hits in tracked files (only .env.example placeholder allowed). Pass.
  QA scenarios (name the exact tool + invocation): happy: valid submit shows success. failure: route 501 -> mailto: link constructed with subject/body (assert href contains mailto:). Evidence .omo/evidence/task-22-zaidos-portfolio.txt
  Commit: Y | feat(apps): Contact window with form, socials, and mailto fallback

- [ ] 23. Articles app + inline reader
  What to do / Must NOT do: src/components/apps/ArticlesApp.tsx: list from content/articles.ts (title, description, reading time, date) -> inline reader window rendering markdown from content/articles/*.md via react-markdown + remark-gfm (install; MIT), code blocks styled simply (no heavy syntax highlighter). "Read full article" link -> /articles/[slug] SSR route (todo 34). Single content module shared with routes (MUST NOT duplicate state/content). 4 articles exactly.
  Parallelization: Wave 4 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): article slugs/titles https://zaidx.me/articles ; react-markdown https://github.com/remarkjs/react-markdown
  Acceptance criteria (agent-executable): Playwright: open Articles -> 4 items; open first -> markdown body renders (h1 + paragraphs). Pass.
  QA scenarios (name the exact tool + invocation): happy: article renders headings. failure: empty/missing md file shows friendly "Article body coming soon" instead of crash. Evidence .omo/evidence/task-23-zaidos-portfolio.txt
  Commit: Y | feat(apps): Articles window with inline markdown reader

- [ ] 24. Terminal shell core (parser, registry, fake fs)
  What to do / Must NOT do: src/lib/shell/parser.ts: tokenizer (quotes, escaped chars), command + args, tests. src/lib/shell/registry.ts: register({ name, aliases, help, handler(args, ctx), complete? }). src/lib/shell/shell.ts: run(input, ctx) -> output lines, unknown command -> `zsh: command not found: X` + "Type 'help' to see what I can do"; history array (up/down) in TerminalApp; prompt `zaid@zaidos:~$`; context { openApp, data, wallpaper, launcher }. Fake fs: src/lib/shell/fakefs.ts (~: projects/, dotfiles/, games/, README.md) with ls/cd/pwd/cat semantics. src/components/apps/TerminalApp.tsx: monospace font-mono, auto-scroll, blinking block cursor, typed-line output animation (fast), ANSI-ish escapes (\x1b[32m green for [ OK ]), click-to-focus, paste, selectable text. TDD parser/registry/fakefs/shell; MUST NOT eval/execute real commands; simulated only.
  Parallelization: Wave 5 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): shell behavior spec in plan Scope; zustand for history? (terminal state local to component)
  Acceptance criteria (agent-executable): Vitest: parser handles quotes/escapes; unknown command returns not-found line; ls/cd/pwd/cat work on fake fs; history order correct. Pass.
  QA scenarios (name the exact tool + invocation): happy: run('ls') lists ~ entries. failure: run('sudo nope') returns sudoers joke. Evidence .omo/evidence/task-24-zaidos-portfolio.txt
  Commit: Y | feat(terminal): shell parser, registry, fake filesystem, and terminal UI

- [ ] 25. Terminal command content
  What to do / Must NOT do: Implement commands: help (grid), about, projects (IDs+status from data), skills (groups), experience, contact (email+socials), socials (URLs clickable), whoami ("zaid - developer who rices his desktop"), date, echo, clear, exit (closes window), open <app>, ls, cd, pwd, cat, history, sudo (rm -rf -> refusal joke "nice try. this isn't real, and neither is your productivity."; else "zaid is not in the sudoers file. This incident will be reported. (to the chess board)"). Outputs pull from data layer. TDD: every command handler has a unit test. MUST NOT hardcode project list in command output (read from content/projects.ts).
  Parallelization: Wave 5 | Blocked by: 3,13,15,24 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): data layer (3); joke tone from GitHub README voice
  Acceptance criteria (agent-executable): Vitest: help exits 0 listing all commands; projects output contains applicator/whatbot/maktaba; open('chess') calls ctx.openApp('chess'). Pass.
  QA scenarios (name the exact tool + invocation): happy: `projects` prints all 12 ids. failure: `open nosuch` prints error line, no crash. Evidence .omo/evidence/task-25-zaidos-portfolio.txt
  Commit: Y | feat(terminal): command content for about/projects/skills/contact/fs/jokes

- [ ] 26. neofetch command
  What to do / Must NOT do: neofetch(): type output: Arch ASCII logo (ORIGINAL text-art, no copied ASCII) + right-aligned lines: zaid@zaidos / OS: ZaidOS x86_64 (browser edition) / Host: your browser (probably) / Kernel: 6.12.1-zen (joke) / Uptime: from session / Shell: zsh 5.9 / WM: Hyprland.web / Terminal: ZaidOS Terminal / CPU: N cores (browser tab) / Memory: fake% / Resolution: window.innerWidth x innerHeight / + accent color blocks using token colors. Rendered as pre-formatted block (special output type). TDD: given session state, output lines match. MUST NOT fabricate a real kernel/host (jokes explicit).
  Parallelization: Wave 5 | Blocked by: 24 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): neofetch style; sessions store for uptime (add uptime.ts store or derive from boot time)
  Acceptance criteria (agent-executable): Vitest: neofetch output contains 'Hyprland.web' + 'zaid@zaidos'; Playwright: type neofetch -> ASCII block visible. Pass.
  QA scenarios (name the exact tool + invocation): happy: all lines present. failure: resolution line equals parseFloat window dims (not NaN). Evidence .omo/evidence/task-26-zaidos-portfolio.txt
  Commit: Y | feat(terminal): neofetch with Arch ASCII and system card

- [ ] 27. Easter eggs: matrix rain, cmatrix, fortune, cowsay, power menu
  What to do / Must NOT do: `matrix`/`cmatrix` -> full-screen canvas rain (reuse MatrixRain todo 7) until key/click/Esc. `fortune` -> 20+ ORIGINAL witty lines in his voice (London System, ricing, sudo survivors, WhatsApp API gateways, Urdu poetry) - no external quotes. `cowsay` -> simple ASCII cow wrapping a fortune line (static template, no dep). Power button dialog (todo 8) implemented here if not already. MUST NOT copy fortune packs; MUST NOT import ASCII art libs.
  Parallelization: Wave 5 | Blocked by: 24 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): MatrixRain (7); voice from GitHub README
  Acceptance criteria (agent-executable): Playwright: `matrix` -> [data-testid="matrix-overlay"] visible, Esc removes; `fortune` prints a non-empty line; `cowsay` prints cow art. Pass.
  QA scenarios (name the exact tool + invocation): happy: overlay toggles. failure: reduced-motion -> matrix single static frame (no rAF loop). Evidence .omo/evidence/task-27-zaidos-portfolio.txt
  Commit: Y | feat(terminal): matrix rain, fortune, cowsay easter eggs

- [ ] 28. Chess mini-game app
  What to do / Must NOT do: npm i chess.js. src/components/apps/ChessApp.tsx: 8x8 CSS-grid board, Unicode piece glyphs, legal-move validation via chess.js, click-move (select piece, show legal target dots), move history (SAN), captured pieces, check/checkmate/stalemate detection + banner, modes Hot-seat + vs Rookie CPU (minimax depth<=2, material eval, ~500ms think delay, random among equal evals), New game + flip board buttons. MUST NOT implement stronger engine (depth<=2 bound); MUST NOT use image assets for pieces.
  Parallelization: Wave 5 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): chess.js https://github.com/jhlywa/chess.js/blob/master/README.md ; API: moves({verbose:true}), move(), isCheckmate(), isStalemate(), isDraw()
  Acceptance criteria (agent-executable): Vitest: chess.js integration (legal move allowed, illegal rejected, checkmate ends game). Playwright: make a legal move (click piece then target) -> board updates; illegal move rejected (no change). Pass.
  QA scenarios (name the exact tool + invocation): happy: pawn e2-e4 advances. failure: rook e1-e5 with pieces in between rejected (uci move throws -> state unchanged). Evidence .omo/evidence/task-28-zaidos-portfolio.txt
  Commit: Y | feat(apps): playable chess game with legal moves and Rookie CPU

- [ ] 29. Terminal + easter-egg e2e suite
  What to do / Must NOT do: ONE Playwright spec (terminal.spec.ts): open terminal (Mod+Enter), help lists commands, about prints bio, projects lists ids, matrix shows overlay, neofetch shows ASCII, sudo rm -rf / returns joke, `cd projects && ls` nav fake fs, open chess opens chess window. chess.spec.ts: legal move works, illegal rejected, checkmate banner on Scholar's mate quick setup (FEN). MUST NOT split terminal assertions into separate specs per command (single suite = faster CI).
  Parallelization: Wave 5 | Blocked by: 24-28 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): commands spec (24,25); chess (28)
  Acceptance criteria (agent-executable): `npx playwright test terminal chess` passes on desktop project. Evidence .omo/evidence/task-29-zaidos-portfolio.txt
  QA scenarios: happy: full command walkthrough green. failure: `open nosuch` shows error line and suite still passes that negative assertion. Evidence same file.
  Commit: Y | test(e2e): terminal and chess end-to-end suites

- [ ] 30. Chatbot KB engine (scripted)
  What to do / Must NOT do: src/lib/chat/kb.ts: intents >=18 (greeting, who_are_you, what_do_you_do, projects, project_specific x8: applicator/whatbot/maktaba/media-cleaner/pu-stacks/zesho/tower-defense/tank-arena, skills, stack, experience, education, availability/hire, contact, socials, chess, arch/ricing, fun, thanks, bye, help_chat); each { id, patterns[], respond: string | (ctx)=>string, fallback[] }. Matcher: lowercase + regex/word-overlap scoring; below threshold -> random fallback line in his voice. ctx injects content data (projects/skills/socials). TDD: matcher picks correct intent; gibberish -> fallback; case/whitespace insensitivity; every intent has >=1 passing pattern test. MUST NOT call any network; pure function.
  Parallelization: Wave 6 | Blocked by: 3,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): project facts + data layer (3); voice from GitHub README
  Acceptance criteria (agent-executable): Vitest: >=18 intents, each with >=1 passing pattern test; fallback on 'asdfgh'; 'what is whatbot' -> whatbot intent (project data injected). Pass.
  QA scenarios (name the exact tool + invocation): happy: 'who are you' -> who_are_you. failure: empty/whitespace input -> help_chat prompt, no crash. Evidence .omo/evidence/task-30-zaidos-portfolio.txt
  Commit: Y | feat(chat): scripted knowledge-base intent engine with fallbacks

- [ ] 31. ZaidGPT chat UI
  What to do / Must NOT do: src/components/apps/ChatApp.tsx: message list (user right accent bubble, bot left glass bubble), typing indicator (3-dot + "zaid is thinking..."), quick-reply chips (Who are you? / Show me projects / Skills / Contact), input + Enter send, localStorage history (cap 100 msgs, clear button), header badge "offline KB" vs "AI mode" (todo 32), footer joke "powered by my own API-transformer vibes". Auto-scroll to bottom. MUST NOT auto-scroll if user scrolled up; MUST NOT send empty messages.
  Parallelization: Wave 6 | Blocked by: 15,30 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): KB engine (30); chat UX pattern
  Acceptance criteria (agent-executable): Playwright: open chat, chip 'Who are you?' -> bot answer bubble; gibberish -> fallback; history persists across window close/reopen (localStorage). Pass.
  QA scenarios (name the exact tool + invocation): happy: quick-reply works. failure: empty input Enter -> no message, no error. Evidence .omo/evidence/task-31-zaidos-portfolio.txt
  Commit: Y | feat(apps): ZaidGPT chat window with typing indicator and history

- [ ] 32. /api/chat LLM route (env-gated)
  What to do / Must NOT do: src/app/api/chat/route.ts: POST { messages } -> if !process.env.LLM_API_KEY -> 501 {mode:'kb'}; else build system prompt from data layer (bio, projects, skills, socials: "Answer as Zaid - first person, witty but helpful, keep answers short"), POST to `${LLM_BASE_URL||'https://api.openai.com/v1'}/chat/completions` with model LLM_MODEL||'gpt-4o-mini', timeout 15s AbortController, truncate history to last 10, cap each incoming user message at 500 chars, never log keys, never echo the raw system prompt or API keys back to the client, treat LLM output as untrusted (no persistent memory beyond the last 10 messages); on error/timeout -> 502 {mode:'kb'}. Client (ChatApp): if mode kb or fetch fails -> use local KB answer (todo 30). MUST NOT hardcode keys; .env.example only.
  Parallelization: Wave 6 | Blocked by: 30 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): OpenAI-compatible chat completions schema; Vercel route handlers https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  Acceptance criteria (agent-executable): Vitest (route handler unit via vi.mock NextRequest/global fetch): no key -> 501; key + mocked fetch -> 200 {mode:'llm', content}; fetch throws -> 502 KB fallback; >500-char message truncated before send; response never contains the raw system prompt string. Pass.
  QA scenarios (name the exact tool + invocation): happy: mocked LLM returns content, client renders bubble. failure: 501 -> client falls back to KB answer visibly. Evidence .omo/evidence/task-32-zaidos-portfolio.txt
  Commit: Y | feat(api): env-gated OpenAI-compatible chat route with KB fallback

- [ ] 33. Chatbot e2e + Settings app with AI toggle
  What to do / Must NOT do: Create src/components/apps/SettingsApp.tsx (wallpaper picker from 7, accent picker, blur toggle, animations toggle, AI-chat toggle, About ZaidOS). Playwright chat.spec.ts: KB answer; route interception of /api/chat -> 501 => KB fallback; -> {mode:'llm', content:'AI says hi'} => AI bubble renders + header shows "AI mode". AI-chat toggle persisted in zustand, rendered in ChatApp header + Settings window. MUST NOT require real keys in CI.
  Parallelization: Wave 6 | Blocked by: 31,32 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): Settings app plan; wallpaper store (7); zustand
  Acceptance criteria (agent-executable): `npx playwright test chat settings` passes (desktop). Pass.
  QA scenarios (name the exact tool + invocation): happy: intercepted LLM content renders. failure: intercept 501 -> KB fallback bubble. Evidence .omo/evidence/task-33-zaidos-portfolio.txt
  Commit: Y | feat(apps): Settings app with appearance toggles + chatbot e2e

- [ ] 34. Articles port + SSR routes
  What to do / Must NOT do: Download the 4 article pages at implementation time (URLs in Findings) -> content/articles/<slug>.md with frontmatter (title, description, date, readingTime, tags) + markdown body (strip old site nav/footer; keep prose). Routes: src/app/articles/page.tsx (SSR list) + src/app/articles/[slug]/page.tsx (SSR reader; generateStaticParams + generateMetadata; revalidate false). Prose styling matching rice theme. MUST keep exact slugs: building-whatsapp-gateway, building-offline-urdu-reader, designing-university-courseware-platform, ai-job-application-assistant. MUST NOT invent content; if a body can't be fetched, keep title+description and mark body "Full article coming soon" (flag in todo 48). Download MUST complete before the DNS cutover in todo 45 (old site may be unreachable after).
  Parallelization: Wave 7 | Blocked by: 3,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): article pages https://zaidx.me/articles/* (4 URLs); markdown linting via remark
  Acceptance criteria (agent-executable): `npx vitest run` content validation passes; build routes /articles + 4 slugs; Playwright: each slug page 200 with h1 matching frontmatter title. Pass.
  QA scenarios (name the exact tool + invocation): happy: slug page renders prose. failure: unknown slug /articles/nope -> 404 (notFound()). Evidence .omo/evidence/task-34-zaidos-portfolio.txt
  Commit: Y | feat(content): port 4 articles with SSR routes and metadata

- [ ] 35. Metadata + OG image
  What to do / Must NOT do: Root layout metadata: title "ZaidOS - Muhammad Zaid", description in his voice (e.g. "The web desktop of Muhammad Zaid - mobile & full-stack developer, AI tinkerer, and Arch Linux ricer. Boot up, poke around, open a terminal."), metadataBase https://zaidx.me, openGraph + twitter. src/app/opengraph-image.tsx via next/og: dark rice card with terminal window (`whoami` -> `zaid`), name, accent green. Per-route metadata for /articles + [slug]. MUST NOT reuse old site's template description/canonical; URL must be https://zaidx.me (not the broken zaidxme).
  Parallelization: Wave 7 | Blocked by: 15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): Next metadata API https://nextjs.org/docs/app/api-reference/functions/generate-metadata ; next/og https://nextjs.org/docs/app/api-reference/file-conventions/metadata-files/opengraph-image
  Acceptance criteria (agent-executable): Playwright: document.title on / contains 'ZaidOS'; meta description contains 'Muhammad Zaid'; og:image URL resolves 200; canonical = https://zaidx.me/. Pass.
  QA scenarios (name the exact tool + invocation): happy: metadata present. failure: assert old template description string absent from all routes. Evidence .omo/evidence/task-35-zaidos-portfolio.txt
  Commit: Y | feat(seo): metadata and rice-styled OG image via next/og

- [ ] 36. sitemap, robots, JSON-LD, humans.txt
  What to do / Must NOT do: src/app/sitemap.ts (/, /articles, 4 slugs); src/app/robots.ts (allow all + sitemap URL); JSON-LD Person in root layout (name, alternateName zaidx, url, sameAs: all 7 socials, jobTitle, alumniOf UoP, knowsAbout: skill list); public/humans.txt (name, site URL, "Crafted by yours truly", tech stack). MUST NOT include /projects or app-query URLs in sitemap (only real routes).
  Parallelization: Wave 7 | Blocked by: 34,35 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): sitemap/robots conventions https://nextjs.org/docs/app/api-reference/file-conventions/metadata-files/sitemap
  Acceptance criteria (agent-executable): fetch /sitemap.xml -> contains /, /articles, 4 slugs; /robots.txt 200 mentions sitemap; /humans.txt 200. Pass.
  QA scenarios (name the exact tool + invocation): happy: sitemap parseable XML. failure: JSON-LD in <head> parses as valid JSON-LD with sameAs length 7. Evidence .omo/evidence/task-36-zaidos-portfolio.txt
  Commit: Y | feat(seo): sitemap, robots, JSON-LD Person, and humans.txt

- [ ] 37. Redirects for old routes
  What to do / Must NOT do: next.config.ts redirects (301 permanent): /projects/:slug -> /?app=projects; /contact -> /?app=contact; /uses -> /?app=about. Root client reads ?app= once at mount and opens that app (desktop: window; mobile: full-screen page). /articles/:slug stays same path (new app serves it). www->apex handled at hosting layer (Vercel), not here. MUST NOT redirect /articles/*.
  Parallelization: Wave 7 | Blocked by: 15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): next.config redirects https://nextjs.org/docs/app/api-reference/next-config-js/redirects ; old routes from zaidx.me nav (Projects section is /#project-N anchors, /projects/:slug existed 404 on old site - redirect regardless for link safety)
  Acceptance criteria (agent-executable): Playwright: /projects/applicator -> 301 + Location /?app=projects; /contact -> 301; /uses -> 301; visit /?app=terminal -> terminal window opens on desktop. Pass.
  QA scenarios (name the exact tool + invocation): happy: redirect chain ends 200 on /. failure: /articles/building-whatsapp-gateway returns 200 (NOT redirected). Evidence .omo/evidence/task-37-zaidos-portfolio.txt
  Commit: Y | feat(routing): 301 redirects for legacy paths and ?app deep-links

- [ ] 38. SEO e2e + Lighthouse baseline
  What to do / Must NOT do: Playwright seo.spec.ts: / 200 + title + meta; /articles/building-whatsapp-gateway 200 + h1; /articles/nope 404; /projects/applicator 301 Location /?app=projects; /sitemap.xml 200; /robots.txt 200; JSON-LD parse. Lighthouse: `npx lighthouse http://localhost:3000 --only-categories=performance,accessibility,seo --output=json --output-path=.omo/evidence/lh-baseline.json`; record scores; perf + a11y >= 90 required on landing route; else FIX in this todo. MUST NOT skip Lighthouse on CI (add optional job gate).
  Parallelization: Wave 7 | Blocked by: 34-37 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): Lighthouse CLI https://github.com/GoogleChrome/lighthouse
  Acceptance criteria (agent-executable): seo.spec.ts green; lh-baseline.json perf>=90 a11y>=90 seo>=90. Evidence .omo/evidence/task-38-zaidos-portfolio.txt + .omo/evidence/lh-baseline.json
  QA scenarios (name the exact tool + invocation): happy: all assertions green. failure: a redirected path returning 200 fails spec (asserts 301 enforced). Evidence same file.
  Commit: Y | test(seo): SEO e2e suite and Lighthouse baseline gate

- [ ] 39. Mobile shell (touch layout)
  What to do / Must NOT do: useIsMobile hook (matchMedia '(pointer: coarse)' + width <1024). MobileShell: slim top bar (ZaidOS mark, clock, menu button), app-drawer (full-screen icon grid, opens via menu tap), apps open as full-screen stacked pages with back button (no drag/resize/minimize chrome), terminal input fixed at bottom with on-screen hint, chat + chess touch-friendly. Shared content components (same apps, different chrome via props). MUST NOT fork app components; MUST NOT show waybar/windows/desktop on mobile.
  Parallelization: Wave 8 | Blocked by: 2,3,4,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): matchMedia https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia ; reuse all apps from waves 4-6
  Acceptance criteria (agent-executable): Playwright (mobile project 390x844): boot shows then mobile shell renders (NOT desktop shell); menu opens drawer; open Projects -> full-screen + back works; terminal input at bottom works. Pass.
  QA scenarios (name the exact tool + invocation): happy: drawer -> app -> back round-trip. failure: desktop waybar is display:none on mobile viewport (assert). Evidence .omo/evidence/task-39-zaidos-portfolio.txt
  Commit: Y | feat(mobile): touch shell with app drawer and full-screen apps

- [ ] 40. Keyboard nav + focus + ARIA
  What to do / Must NOT do: Focus management: window open focuses content; Tab cycles within focused window then to waybar + desktop icons; focus trap for launcher/context menu/chat modal + ESC; visible focus-visible ring (2px accent offset). ARIA: waybar role menubar; window role dialog aria-label title; desktop role application; launcher combobox+listbox; chat aria-live polite; aria-labels on all icon buttons; skip link "Skip to desktop" (focuses desktop). axe-core/playwright scans (wcag2a, wcag2aa) on landing, terminal, chat - 0 critical/serious violations. MUST NOT trap keyboard in desktop shell (open system).
  Parallelization: Wave 8 | Blocked by: 13,15,39 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): axe-core/playwright https://github.com/dequelabs/axe-core ; ARIA APG dialog pattern https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  Acceptance criteria (agent-executable): Playwright a11y.spec.ts: Tab order reaches launcher; ESC closes launcher; axe scans 0 critical/serious on /, terminal, chat. Pass.
  QA scenarios (name the exact tool + invocation): happy: full keyboard walkthrough. failure: axe finds violation -> spec fails (gate active). Evidence .omo/evidence/task-40-zaidos-portfolio.txt
  Commit: Y | feat(a11y): keyboard navigation, focus management, and ARIA roles

- [ ] 41. Reduced motion + contrast
  What to do / Must NOT do: Global reduced-motion: boot animations instant, matrix loop static frame, gradient static, window animations instant, launcher fade only. Motion components use MotionConfig reducedMotion="user". Settings animations toggle overrides (forces on/off). Contrast: tokens designed for WCAG AA (verify text-on-surface >= 4.5:1; muted only for non-essential text); axe color-contrast rule passes on landing. MUST NOT ship elements that auto-animate against reduced-motion preference.
  Parallelization: Wave 8 | Blocked by: 2,13,15 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): prefers-reduced-motion https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion ; MotionConfig https://motion.dev/docs/react-reduced-motion
  Acceptance criteria (agent-executable): Playwright reduced-motion.spec.ts: emulateMedia reduce -> matrix static (frame counter), boot instant; axe color-contrast on / passes. Pass.
  QA scenarios (name the exact tool + invocation): happy: reduced-motion matrix static. failure: forced-animations toggle re-enables and matrix animates (proves override works). Evidence .omo/evidence/task-41-zaidos-portfolio.txt
  Commit: Y | feat(a11y): reduced-motion support and contrast compliance

- [ ] 42. Performance budget
  What to do / Must NOT do: Ensure dynamic imports (todo 15) keep apps out of main bundle; next/image for photo + OG-safe; next/font self-hosted with display swap; preload critical CSS; terminal/matrix/chess/chat code-split. `next build` output must show landing route first-load JS <= 150KB gzipped. Wire a CI-assertable check: a job in .github/workflows/ci.yml parses the build output / route chunk sizes and FAILS the pipeline if initial JS > 150KB gzipped (no eyeball-only check). MUST NOT lazy-load the desktop shell itself (boot+waybar+wm are critical path for landing).
  Parallelization: Wave 8 | Blocked by: 15,39 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): next build output sizes; dynamic import https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
  Acceptance criteria (agent-executable): `npm run build` shows landing JS <= 150KB gzip; CI budget job present and fails on >150KB; Lighthouse perf (todo 38 baseline) still >= 90 after optimization. Pass.
  QA scenarios (name the exact tool + invocation): happy: build sizes within budget. failure: adding static import of one app to host makes size exceed - CI budget job fails (proves gate works). Evidence .omo/evidence/task-42-zaidos-portfolio.txt
  Commit: Y | perf: lazy-load apps and meet 150KB initial-JS budget

- [ ] 43. Mobile + a11y e2e suite
  What to do / Must NOT do: mobile.spec.ts (390x844): boot -> mobile shell; drawer -> Projects -> back; terminal works; chat quick-reply works. a11y.spec.ts (from 40) + reduced-motion.spec.ts (41) consolidated into one e2e suite. Run both Playwright projects in CI. MUST NOT gate on flaky screenshot comparisons (assert DOM state, not pixels).
  Parallelization: Wave 8 | Blocked by: 39-42 | Blocks: 44-48
  References (executor has NO interview context - be exhaustive): playwright projects config (5)
  Acceptance criteria (agent-executable): `npx playwright test` fully green on projects desktop + mobile. Evidence .omo/evidence/task-43-zaidos-portfolio.txt
  QA scenarios: happy: full matrix green. failure: each suite leaves no flaky retries >2. Evidence same file.
  Commit: Y | test(e2e): consolidated mobile and accessibility suites

- [ ] 44. Vercel project + env vars
  What to do / Must NOT do: Create .env.example (RESEND_API_KEY, CONTACT_TO_EMAIL=hello@zaidx.me, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL) + README section on envs. `npx vercel link` + `npx vercel deploy --prod` (auth may be interactive - if credentials unavailable, document manual steps in README and continue with local build verification only; DO NOT fake success). Set env vars in Vercel (dashboard or vercel env add). MUST NOT commit real keys.
  Parallelization: Wave 9 | Blocked by: all waves | Blocks: 45-48
  References (executor has NO interview context - be exhaustive): Vercel envs https://vercel.com/docs/environment-variables ; .env.example pattern
  Acceptance criteria (agent-executable): if vercel CLI authed: `vercel env ls` shows 5 vars + `vercel ls` shows project; else README documents exact manual steps and this todo is marked SKIPPED-CLI (not failure).
  QA scenarios (name the exact tool + invocation): happy: prod deploy URL returns 200. failure: no auth -> documented steps + local build green only. Evidence .omo/evidence/task-44-zaidos-portfolio.txt
  Commit: Y | chore(deploy): Vercel project setup, env docs, and prod deploy

- [ ] 45. Domain cutover zaidx.me
  What to do / Must NOT do: PRECONDITION: all downloads from the old site MUST be complete before this todo (profile photo todo 17, article bodies todo 34) - the old Cloudflare site may be unreachable after cutover. BEFORE any change, snapshot current DNS into .omo/evidence/task-45-zaidos-portfolio.md: dig +short zaidx.me, dig +short www.zaidx.me, dig +short whatbot.zaidx.me AND `dig whatbot.zaidx.me ANY` (capture record TYPE + full details, not just resolution) + the DNS provider's record list. Then add zaidx.me + www.zaidx.me in Vercel project Settings -> Domains; follow Vercel instructions (apex: ALIAS/ANAME or A 76.76.21.21; www: CNAME cname.vercel-dns.com). CRITICAL: do NOT touch the `whatbot` subdomain record; verify it remains after changes. Remove Cloudflare only from apex/www records (old zone left in place for rollback). Wait + verify `dig +short zaidx.me` resolves (up to 24h). MUST NOT use a wildcard DNS blanket that could swallow whatbot.
  Parallelization: Wave 9 | Blocked by: 44 | Blocks: 46-48
  References (executor has NO interview context - be exhaustive): Vercel domains docs https://vercel.com/docs/domains ; record previous dig output first (rollback safety)
  Acceptance criteria (agent-executable): dig +short zaidx.me matches Vercel target; whatbot.zaidx.me dig output UNCHANGED vs before (type + value). Rollback TEST: the rollback section in the evidence file is an exact revert sequence that reproduces the before-state snapshot (verify with dig). Document in evidence.
  QA scenarios (name the exact tool + invocation): happy: apex resolves to new host, whatbot record identical. failure: if whatbot record altered -> restore immediately from saved values (rollback sequence). Evidence .omo/evidence/task-45-zaidos-portfolio.md
  Commit: Y | chore(infra): cut over zaidx.me apex/www DNS to Vercel (whatbot untouched)

- [ ] 46. Post-deploy verification (prod)
  What to do / Must NOT do: curl https://zaidx.me: / -> 200; /articles/building-whatsapp-gateway -> 200; /projects/applicator -> 301 Location /?app=projects; /contact -> 301; /uses -> 301; /sitemap.xml 200; /robots.txt 200; /opengraph-image* 200; /icon.svg 200; /humans.txt 200. External: https://whatbot.zaidx.me 200; https://applicator.netlify.app 200; https://kens.netlify.app 200. Playwright against prod URL: boot renders, open app, terminal `help` works. Save all HTTP codes + headers to .omo/evidence/task-46-zaidos-portfolio.json. MUST NOT skip if a 301 chain needs following (-L) - assert the 301 itself AND final 200.
  Parallelization: Wave 9 | Blocked by: 45 | Blocks: 47-48
  References (executor has NO interview context - be exhaustive): routes list (34-37); prod URL after cutover
  Acceptance criteria (agent-executable): all curl codes match expected table; whatbot + netlify apps still 200; Playwright prod smoke green. Evidence JSON saved.
  QA scenarios (name the exact tool + invocation): happy: all codes exact. failure: any 5xx or unexpected redirect -> fix and re-verify (do not declare done). Evidence .omo/evidence/task-46-zaidos-portfolio.json
  Commit: Y | chore(infra): post-deploy verification of routes, redirects, and externals

- [ ] 47. Analytics + project docs
  What to do / Must NOT do: `npm i @vercel/analytics` + <Analytics /> in root layout (cookieless, no banner needed). README.md: overview, stack, dev commands, env table, content-editing guide (add project/article), deploy notes, rollback notes. AGENTS.md for future agent sessions (repo layout, test commands, conventions). MUST NOT add cookie banners or third-party trackers beyond Vercel Web Analytics.
  Parallelization: Wave 9 | Blocked by: 46 | Blocks: 48
  References (executor has NO interview context - be exhaustive): @vercel/analytics https://vercel.com/docs/analytics
  Acceptance criteria (agent-executable): README + AGENTS.md exist with no broken command blocks; Analytics component in layout.
  QA scenarios (name the exact tool + invocation): happy: dev commands in README run. failure: doc references a file path that doesn't exist -> fix. Evidence .omo/evidence/task-47-zaidos-portfolio.txt
  Commit: Y | docs: README, AGENTS.md, and Vercel Web Analytics

- [ ] 48. Final content/link sweep + release
  What to do / Must NOT do: Proofread all copy (his voice, no template text anywhere - grep for old template phrases); verify every project link resolves (whatbot/applicator/kens 200, zanith-build 404 note shown correctly); all socials resolve to correct profiles; confirm contactEmail replaced from placeholder (BLOCKED if still hello@zaidx.me - ask user); confirm no "coming soon" article bodies; full `npm run test:unit`, `npx playwright test`, `npm run build` one final time; `git tag v1.0.0`. Save QA checklist to evidence. MUST NOT ship placeholder email or template copy.
  Parallelization: Wave 9 | Blocked by: 46,47 | Blocks: F1-F4
  References (executor has NO interview context - be exhaustive): all content files (3,34); template-phrase blacklist from Findings
  Acceptance criteria (agent-executable): grep blacklist phrases -> zero hits; all link checks 200/expected; test+build green; tag exists; evidence checklist complete.
  QA scenarios (name the exact tool + invocation): happy: full sweep green. failure: any dead link or template phrase -> fix before tag. Evidence .omo/evidence/task-48-zaidos-portfolio.txt
  Commit: Y | chore(release): final QA sweep and v1.0.0 tag

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit: walk every todo 1-48, confirm each acceptance criterion has evidence in .omo/evidence/task-<N>-zaidos-portfolio.*; no todo marked done without evidence. Deliverable: audit table (todo -> status -> evidence file).
- [ ] F2. Code quality review: `npm run lint` + `npm run typecheck` green; review WM store, shell parser, chatbot matcher for correctness; no console errors in Playwright runs; bundle size budget met (build output). Deliverable: review notes + final gate status.
- [ ] F3. Real manual QA: Playwright full suite on BOTH projects (desktop + mobile) green; Lighthouse (perf, a11y, seo >= 90 on /) re-run against FINAL build; prod smoke on https://zaidx.me. Deliverable: final QA report in .omo/evidence/.
- [ ] F4. Scope fidelity: diff against Scope Must/Must NOT - nothing from Must NOT got built (grep for xterm, real system metrics, template phrases, DB/auth); nothing in Must has silently shipped partial (boot, terminal, chatbot, chess, redirects, mobile). Deliverable: scope checklist.

## Commit strategy
- Conventional Commits: `feat(scope)`, `fix`, `style(tokens)`, `chore`, `test`, `docs`, `perf` - one commit per todo (atomic).
- Repo is fresh: git init at todo 1; branch strategy: work on `main` directly (solo project) OR feature branch + PR per wave (recommended if pushing to GitHub - recommended repo name `zaidos`).
- Final release: tag `v1.0.0` at todo 48 after sweep; PR from branch -> main if branching was used.

## Success criteria
1. https://zaidx.me serves the ZaidOS web desktop: boot -> desktop with waybar + 5 workspaces, draggable/resizable windows, launcher, terminal, all 11 apps open and functional.
2. Terminal executes every documented command incl. neofetch, matrix, fortune, sudo joke, open <app>, fake-fs ls/cd; chess app validates legal moves and ends games correctly.
3. ZaidGPT answers from KB offline (>=18 intents, fallbacks in his voice) and switches to real-LLM when env keys are set.
4. All 4 articles live at the SAME slugs with working SSR pages; old routes 301; sitemap/robots/JSON-LD/OG all valid; no template copy anywhere.
5. Mobile users get a touch shell, not a broken desktop; keyboard-only users navigate everything; reduced-motion respected; WCAG AA contrast.
6. Landing-route initial JS <= 150KB gzipped; Lighthouse perf + a11y + seo >= 90 on /.
7. whatbot.zaidx.me + applicator.netlify.app + kens.netlify.app remain live and untouched after cutover; rollback documented and tested.
8. All agent-executed verification evidence saved under .omo/evidence/; F1-F4 all APPROVE.
