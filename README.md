# ZaidOS

A Hyprland-rice web desktop portfolio for [Muhammad Zaid](https://zaidx.me) — boot into a simulated OS, open app windows, use the terminal, chat with ZaidGPT, and play chess. Built with Next.js 16, React 19, Tailwind v4, and Zustand.

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Motion
- **State:** Zustand (boot, wallpaper, WM, workspaces, settings)
- **Content:** Typed data layer in `src/content/`
- **Tests:** Vitest + Playwright + axe-core

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:unit    # Vitest
npm run test:e2e     # Playwright (desktop + mobile projects)
npm run lint
npm run typecheck
npm run build
node scripts/check-js-budget.mjs   # landing JS <= 150KB gzip
```

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Contact form email relay |
| `CONTACT_TO_EMAIL` | Recipient for contact submissions |
| `RESEND_FROM` | Optional verified sender |
| `LLM_API_KEY` | ZaidGPT AI mode (OpenAI-compatible) |
| `LLM_BASE_URL` | API base (default: OpenAI) |
| `LLM_MODEL` | Model name (default: gpt-4o-mini) |

Without `LLM_API_KEY`, chat falls back to the offline knowledge base. Without `RESEND_API_KEY`, contact falls back to mailto.

## Editing content

- **Projects, skills, experience:** `src/content/projects.ts`, `skills.ts`, `experience.ts`
- **Articles:** Markdown in `src/content/articles/*.md` + metadata in `src/content/articles.ts`
- **Site copy:** `src/content/site.ts`

## Deploy (Vercel)

1. Connect the repo to Vercel
2. Set env vars from `.env.example` in the Vercel dashboard
3. Deploy — apex `zaidx.me` + `www` point to Vercel
4. **Do not** change the `whatbot.zaidx.me` DNS record

### Rollback

Restore apex/www DNS to the pre-cutover values saved in `.omo/evidence/task-45-zaidos-portfolio.md` before any DNS change.

## License

Private portfolio project.
