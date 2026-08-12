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

### Contact email (Resend + Cloudflare DNS)

1. Verify `zaidx.me` in [Resend](https://resend.com/domains) and add the SPF/DKIM records to your Cloudflare DNS zone.
2. Set env vars:
   - `RESEND_API_KEY` — from Resend dashboard
   - `RESEND_FROM=ZaidOS <hello@zaidx.me>` — must use a verified `@zaidx.me` address (leave unset only for sandbox testing)
   - `CONTACT_TO_EMAIL` — inbox that receives form submissions
3. Optional inbound mail: in Cloudflare → **Email Routing**, forward `hello@zaidx.me` → your Gmail so you can receive replies at the same address you send from.

## Deploy (Vercel)

1. Connect this repo to Vercel
2. Set env vars from `.env.example`
3. Build uses `vercel.json` — static `dist/` + `/api` serverless Express

## Layout

See `AGENTS.md` for repo map and conventions.
