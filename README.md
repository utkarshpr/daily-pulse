<div align="center">

# Daily Pulse

**A beautiful, local-first command center for your day.**
Routines, goals, notes, reminders, journal, calendar — all in one private, offline-ready PWA.

`React 18` · `Vite 5` · `Tailwind` · `Zero backend` · `Your data, your browser`

</div>

---

## Why Daily Pulse?

Most habit and productivity apps either lock you into a cloud, hide your data behind a login, or do one thing well and a dozen things poorly. Daily Pulse runs entirely in your browser, stores everything in `localStorage`, and bundles a tightly-integrated set of tools that talk to each other — so the routine you complete this morning shows up in your streak, your stats, your weekly review, and your badge shelf without ever leaving the device.

No account. No sync server. No telemetry. Open the page, use the app.

---

## Highlights

| | |
| :-- | :-- |
| **Today** | Daily routine checklist, animated progress ring, current streak, swipe-to-complete, freeze days, weekly progress at a glance. |
| **Routines** | Fully configurable habits — name, emoji, time, color, weekdays, category, description. Drag to reorder. AI-style suggestions to help you start. |
| **Goals** | Long-running outcomes broken into milestones, linked to the routines that move them forward. |
| **Calendar** | Month view of completions, reminders, and goals. Subscribe to external **ICS feeds** by URL or file. |
| **Notes** | Markdown editor with `[[wiki-links]]`, interactive `- [ ]` checklists, image paste/drop, pinning, color labels, full-text search. |
| **Reminders** | Natural-language smart input — *"in 30 min"*, *"tomorrow at 9"*, *"every monday"*. Browser notifications via service worker. |
| **Journal** | Free-form daily writing with on-this-day flashbacks. |
| **News** | Lightweight reader that stays usable even when the app is in **Freeze** focus mode. |
| **Pomodoro** | Focus/break timer that links to a routine, counts daily focuses, and resets at midnight. |
| **Quick Capture & Inbox** | Press <kbd>I</kbd> from anywhere to dump a thought. Triage to a routine, reminder, or note later. |
| **Stats & Badges** | 12-week heatmap, 30-day per-routine bars, lifetime totals, achievement shelf with confetti. |
| **Profiles** | Multiple isolated workspaces (personal, work, side project) — each with its own data. |
| **Themes & Moods** | Light/dark plus four ambient gradient presets: **Aurora**, **Sunset**, **Forest**, **Ocean**. |
| **Sounds** | Pick from several reminder chime packs, or mute. Subtle haptic vibration on supported devices. |
| **Command Palette** | <kbd>⌘</kbd><kbd>K</kbd> to fuzzy-jump anywhere — pages, routines, notes, actions. |
| **PWA** | Install to home screen / dock. Works offline. Service-worker-driven reminders even when the tab is closed. |
| **Privacy & backup** | One-click JSON or CSV export. **AES-encrypted backups** via Web Crypto. Print today's checklist. |

---

## Feature tour

### Daily flow

- **Today** view shows what matters right now: today's routines (filtered by weekday), an animated progress ring, your current streak, and a 7-day mini progress bar. Swipe a row left/right on touch devices to toggle complete; long-press or click <kbd>⋯</kbd> for per-routine notes and skips.
- **Freeze days** let you pause streaks without breaking them — useful for travel, sickness, or rest days.
- **Pomodoro** sits next to your routines and can be **linked to a specific routine**, so finished focus blocks count toward that habit's streak.
- **Daily review** prompts at a configurable evening time and writes a structured reflection.

### Capture without friction

- <kbd>I</kbd> opens **Quick Capture** from anywhere — a single textarea that lands in your **Inbox**.
- The inbox is a triage zone. Convert any item into a routine, reminder, or note in one click.
- The <kbd>⌘</kbd><kbd>K</kbd> **command palette** searches across pages, routines, notes, and quick actions.

### Smart natural-language input

The reminder/routine input understands phrases like:

```
take vitamins every morning at 8
call mom tomorrow at 6pm
deep work block in 45 min
review goals every sunday at 9am
```

If you type something on the wrong tab, Daily Pulse politely offers to hand it off — type a one-shot date in *Routines* and it suggests creating a *Reminder* instead.

### Notes that link and embed

- Markdown rendering with `marked`.
- `[[Note Title]]` creates a wiki-style link to another note.
- `- [ ] item` becomes an interactive checkbox.
- Paste or drag-and-drop images directly into a note.
- Pin, color-label, and full-text search across the corpus.

### Goals + Calendar + ICS

- **Goals** give a longer arc to your work — milestones with target dates, linked to the routines moving them forward.
- The **Calendar** view threads completions, reminders, goals, and any **ICS feeds** you subscribe to (Google Calendar, work calendars, holidays, etc.) into a single month grid. Import from URL or upload a `.ics` file.

### Insights

- **Stats**: 12-week heatmap, 30-day per-routine completion bars, lifetime totals, best streaks.
- **Weekly Summary** appears Sunday evenings with a recap and a gentle nudge for next week.
- **On This Day** surfaces journal entries and notes from the same date in past years.
- **Badges** unlock as you build streaks, complete categories, and hit lifetime milestones — with confetti.

### Customize the vibe

- **Mood presets** apply layered radial gradients to the entire app: *Aurora*, *Sunset*, *Forest*, *Ocean*.
- **Theme**: Light, Dark, or System.
- **Sound packs**: choose your reminder chime, or silence it.

### Privacy first

- All data stored in `localStorage` under `dp.*` keys, scoped per profile.
- **Encrypted backup**: export an AES-GCM-encrypted blob (Web Crypto, PBKDF2 key derivation) and restore it with the same passphrase.
- Plain **JSON** and **CSV** exports for portability.
- **Print** today's routine as a paper checklist.
- No analytics. No third-party fonts. No external requests beyond ICS feeds you choose to subscribe to.

### Offline & installable

- Works fully offline once loaded.
- **Install prompt** offers PWA install on supported browsers.
- Service worker keeps reminders firing even when the tab is closed.

---

## Keyboard shortcuts

| Key | Action |
| :-: | :-- |
| <kbd>T</kbd> | Today |
| <kbd>R</kbd> | Routines |
| <kbd>G</kbd> | Goals |
| <kbd>C</kbd> | Calendar |
| <kbd>N</kbd> | Notes |
| <kbd>M</kbd> | Reminders |
| <kbd>J</kbd> | Journal |
| <kbd>S</kbd> | Stats |
| <kbd>I</kbd> | Quick capture |
| <kbd>⌘</kbd><kbd>K</kbd> | Command palette |
| <kbd>?</kbd> | Cheat sheet |
| <kbd>⌘</kbd><kbd>↵</kbd> | Save in Quick Capture |

Touch gestures: swipe left/right on a routine row to toggle complete, long-press for the action menu, pull-to-refresh on Today.

---

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

```bash
npm run build     # production bundle into dist/
npm run preview   # serve the built bundle locally
```

---

## Deploy

Daily Pulse is a plain Vite static build, so it runs on any static host:

1. **Vercel** — push to GitHub and import on [vercel.com/new](https://vercel.com/new). Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`. The bundled `vercel.json` rewrites all routes to `/` so client-side state survives refreshes.
2. **Vercel CLI** — `npm i -g vercel && vercel` from the project root.
3. **Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront** — point them at `dist/` after `npm run build`.

No environment variables. No database. No server.

---

## Where is my data?

Everything is stored in `localStorage` under keys prefixed with `dp.`. Each **profile** has its own namespace, so switching profiles swaps the entire dataset cleanly.

Clearing your browser data will erase it. Use **Export JSON** (or the **Encrypted backup** option) from the sidebar regularly. Imports merge or replace based on the prompt you choose.

---

## Tech stack

| | |
| :-- | :-- |
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | `lucide-react` |
| Markdown | `marked` |
| Confetti | `canvas-confetti` |
| Storage | `localStorage` (no backend) |
| Crypto | Web Crypto API (AES-GCM + PBKDF2) |
| Notifications | Service Worker + Notifications API |

---

## Project structure

```
src/
├── App.jsx              # Root: state wiring, routing, profile orchestration
├── components/          # All UI (Today, Routines, Notes, Calendar, …)
├── hooks/               # useLocalStorage, useSwipe, usePullToRefresh, …
├── lib/
│   ├── nlparse.js       # Natural-language date/recurrence parser
│   ├── recurrence.js    # Next-occurrence math
│   ├── ics.js           # ICS feed parsing & import
│   ├── crypto.js        # AES-GCM encrypted backup
│   ├── badges.js        # Achievement rules
│   ├── chime.js         # Sound packs + haptics
│   ├── presets.js       # Mood gradient presets
│   ├── push.js          # Service worker / notification glue
│   └── ...
└── index.css            # Tailwind + theme tokens
```

---

<div align="center">

Built for people who want to own their daily data.

</div>
