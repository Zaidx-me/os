# ZaidOS

macOS-style web portfolio for [Muhammad Zaid](https://zaidx.me) — boot, unlock, open apps, terminal, ZaidGPT, chess, and more. Vite + React 19 + Express API.

## Stack

- **Frontend:** Vite 7, React 19, Tailwind v4, Framer Motion, Zustand
- **API:** Express (`server/`) — contact, chat, music, browser proxy
- **Content:** `src/zaidos/content/`

## Development

```bash
npm install
npm run dev          # Vite :5173 + API :5174
npm run build
npm run start        # production: API serves dist/
npm run lint
npm run optimize:wallpapers
```

Copy `.env.example` → `.env` for API keys (`LLM_API_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, etc.).

## Deploy (Vercel)

1. Connect this repo to Vercel
2. Set env vars from `.env.example`
3. Build uses `vercel.json` — static `dist/` + `/api` serverless Express

## Layout

See `AGENTS.md` for repo map and conventions.
