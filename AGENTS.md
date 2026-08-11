<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ZaidOS — Agent guide

## Layout

- `src/app/` — Next.js routes (`page.tsx` shell, `/articles`, `/api/contact`, `/api/chat`)
- `src/components/wm/` — Desktop shell (Waybar, Window, Launcher, MobileShell)
- `src/components/apps/` — Windowed apps (lazy-loaded via `src/lib/apps.tsx`)
- `src/content/` — Typed data layer (single source of truth)
- `src/lib/shell/` — Simulated terminal (parser, registry, fake fs, commands)
- `src/lib/chat/` — ZaidGPT knowledge base
- `src/store/` — Zustand stores (boot, wm, workspaces, wallpaper, settings)
- `e2e/` — Playwright specs (desktop + mobile projects)
- `.omo/plans/` — Work plan and evidence

## Commands

```bash
npm run dev
npm run test:unit
npm run test:e2e
npm run lint && npm run typecheck && npm run build
node scripts/check-js-budget.mjs
```

## Conventions

- Apps register in `src/lib/apps.tsx`; icons in `src/components/ui/AppIcon.tsx`
- WM mutations go through `src/lib/wm/actions.ts` (never raw store calls from UI)
- Content commands read from `@/content`, never hardcoded lists
- Evidence for completed todos: `.omo/evidence/task-<N>-zaidos-portfolio.txt`
- Desktop vs mobile: `useIsMobile()` switches shells in `src/app/page.tsx`
