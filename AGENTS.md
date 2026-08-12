# ZaidOS — Agent guide

## Layout

- `src/app/` — macOS system apps (Finder, Safari, Mail, Settings, …)
- `src/zaidos/apps/` — Portfolio windowed apps (About, Projects, Terminal, …)
- `src/zaidos/content/` — Typed data layer (single source of truth)
- `src/zaidos/lib/shell/` — Simulated terminal (parser, registry, fake fs, commands)
- `src/zaidos/mobile/` — Mobile app registry and dock config
- `src/layouts/` — Desktop + mobile shells, boot/lock/setup screens
- `src/components/mobile/` — iOS UI (AssistiveTouch, home pages, switcher)
- `server/` — Express API (contact, chat, browser, music, proxy)
- `api/index.js` — Vercel serverless entry (re-exports Express app)
- `public/` — Wallpapers (`Wallpaper/optimized/`), icons, lockscreen assets

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run start
```

## Conventions

- Portfolio content reads from `src/zaidos/content/`, never hardcoded lists
- Mobile apps register in `src/zaidos/mobile/registry.js`
- macOS icons via `src/zaidos/lib/appIcons.js`
- Desktop vs mobile: `useIsMobile()` switches shells in `src/App.jsx`
- API keys in `.env` only; see `.env.example`
