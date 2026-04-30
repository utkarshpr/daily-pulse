# Daily Pulse

A beautiful, local-first daily routine, notes, and reminders tracker. Pure frontend — your data lives in your browser. Deploys to Vercel as a static site with zero config.

## Features

- **Today**: Daily routine checklist, weekly progress, current streak, animated progress ring.
- **Routines**: Fully configurable habits — name, emoji, time, color, and which weekdays they apply to. Edit, reorder, delete.
- **Notes**: Create, edit, pin, color-code, search, and delete notes.
- **Reminders**: Time-based nudges with browser notifications (granted only when you allow).
- **Stats**: 12-week heatmap, 30-day per-routine completion bars, lifetime totals.
- **Theme**: Light & dark mode.
- **Backup**: One-click JSON export / import — no account required.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

The project is a plain Vite static build, so any of these work:

1. **Dashboard** — push the repo to GitHub and import it on [vercel.com/new](https://vercel.com/new). Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`. Vercel auto-detects this.
2. **CLI** — `npm i -g vercel && vercel` from the project root.

No environment variables, no database, no server. The included `vercel.json` rewrites all routes to `/` so client-side state survives refreshes.

## Where is my data?

Everything is stored in `localStorage` under the `dp.*` keys. Clearing your browser data will erase it — use the **Export data** button in the sidebar regularly to back up.
