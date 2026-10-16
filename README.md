# BALISOFT TimeKeeping

A local time-tracking and multitasking dashboard for BALISOFT developers and BI analysts. React + Vite + Tailwind CSS + Lucide icons, running on `localhost`. All data stays in your browser's `localStorage`.

## Setup

Requires Node.js 20.19+ (or 22+).

```bash
npm install
npm run dev      # opens http://localhost:5173
```

The dev server also listens on your local network, so a phone on the same Wi-Fi can open the **Network** address Vite prints (for example `http://192.168.1.20:5173`). On Windows, allow Node.js through the firewall for *Private networks* when asked. If the phone can't connect, check the PC's network is set to *Private* (Settings > Network & internet > your Wi-Fi > Network profile type).

### Use it with your own data

Anyone can clone the repo and run it; there is nothing to configure and no account or database. Each person's data lives only in their own browser (see *Data* below).

```bash
git clone https://github.com/balibrera-dev/TimeKeeping.git
cd TimeKeeping
npm install
npm run dev
```

To host your own copy, import your fork into Vercel (framework preset *Vite*, build `npm run build`, output `dist`). Every push to `main` then redeploys.

Other scripts:

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm test         # timer engine / export unit tests (node:test)
```

## What it does

- **Clients**: create, rename, recolor and delete clients in the *Clients* tab. Each task can belong to a client; its color tags the task card, calendar blocks, charts and the switcher, and the calendar shows time *By client*. Filter the task list by client.
- **Templates**: reusable blueprints (title, category, subtasks with default estimates in minutes). Create, edit, duplicate, delete. Three starter templates are seeded on first run: *New Development*, *Add Visual to Existing Report*, *Fix Data Pipeline Issue*.
- **Tasks**: create from a template (copies its checklist and estimates, which you can tweak) or ad-hoc. Creating a task does **not** start it: a prompt offers *Start* / *Switch* (or use *Create & start*). Task cards are collapsed by default; expand one for subtasks, comments, client and sessions.
- **Time per subtask**: click a subtask's name to put the timer on it. Clicking another subtask moves the timer there (the time so far stays on the first one), and clicking a subtask of a paused task switches to that task on that subtask. Each subtask shows tracked time vs. its estimate; the task total is the sum. Checking off the running subtask moves the timer to the next open one.
- **One-click switch**: the sticky header always shows the active task and subtask. *Switch* (or press <kbd>S</kbd> anywhere) pauses the running timer and starts the chosen task in one atomic update. Type a new name in the switcher to create an ad-hoc task. Only one timer can run at a time.
- **Call / Break / Lunch / Idle**: one click in the header stops current work and tracks the interruption as its own entry (a call asks for a name and optional client). *Back to …* ends it and resumes the task you were on; *End* just stops. Find them under *Calls & breaks* in the task list. **Idle** time is tracked and shown (dashed) on the calendar and in exports, but it is never counted in *Tracked*, per-day or per-client totals.
- **Estimate alerts**: a couple of minutes before the running subtask reaches its estimate (or the task's, when no subtask is selected) the app pings and shows a prompt: *Stay on it*, *Next subtask* or *Pause*. Staying is the default; Settings can switch to *move to the next subtask automatically* at the estimate (with *Go back* to undo). The tab title shows ⏰ while a prompt waits. Optional **desktop notifications** (Windows notification area) show the alert when the app is in the background; they need localhost or https, so they don't work on the Wi-Fi address. Background tabs are throttled by the browser, so an alert can arrive up to about a minute late.
- **Controls**: Start / Pause / Resume / Done / Reset on every task. <kbd>Space</kbd> pauses the active task (or ends a call and resumes), or resumes the last one.
- **Comments**: one comment per subtask (tasks without subtasks have one task comment), with a one-click timestamp. An optional **Improve with AI** button (off by default, see *Feature flags*) rewrites a comment with Claude, using each user's own Anthropic API key.
- **Editing completed subtask times**: click the time of a checked-off subtask to type its real total (`1:30`, `90`, `1h 30m`). The task total follows; an asterisk marks edited times and *Reset* goes back to the tracked value. Calendar sessions and the daily export keep what the timer recorded. Turn this off in Settings (gear icon) to lock times.
- **Calendar**: Outlook-style Day and Week views with your tracked sessions as blocks (labelled with the subtask), a live "now" line, per-day totals, and click-a-day to drill in. Side panel shows total tracked, sessions, per-task and per-client breakdowns, and progress against subtask estimates.
- **Export**: CSV or JSON of the shown day's sessions (today by default) with client, task, subtask, type (task / call / break / lunch / idle), whether it counts toward totals, and comment, for timesheets. The JSON total leaves idle out and reports it as `idleMinutes`.
- **Light / dark theme** toggle.

## How time is measured

Elapsed time is always computed from `Date.now()` timestamps (`sum(closed sessions) + (now − activeStart)`). The 1-second interval only re-renders the UI, so backgrounded tabs, sleep, or a laggy machine never cause drift. A running timer survives a page refresh or browser restart. Sessions that cross midnight are split across days in the calendar and exports.

## Project layout

```
src/
  components/   UI: ActiveBar, SwitchMenu, InterruptMenu, TasksView, TaskCard, CommentBox, ClientsView, TemplatesView,
                CalendarView, CalendarGrid, MetricsPanel, SettingsModal, StartPrompt, ui primitives
  hooks/        useTracker (state + persistence + cross-tab sync), useNow (clock), useTheme
  types/        JSDoc data shapes (Template, Task, TimeLog)
  utils/        reducer (timer engine), sessions (math), export (CSV/JSON), ai (comment rewrite), storage, time formatting
```

## Feature flags

Copy `.env.example` to `.env.local` and restart the dev server (or rebuild) to change them.

- `VITE_ENABLE_AI=true` shows the **Improve with AI** button and the API-key fields in Settings. It's off by default.

## Data

Stored under the `balisoft-timekeeping:v1` key in `localStorage` (data from earlier versions is upgraded automatically). AI settings are kept separately under `balisoft-timekeeping:ai`. Clearing site data for `localhost:5173` wipes it, so export regularly if you need a record. Changes made in one tab show up in other open tabs of the app.

Storage is per browser **and per address**, so the same person can have several separate data sets:

| Where you open it | Where the data is |
| --- | --- |
| `http://localhost:5173` on the PC | That PC's browser, for `localhost:5173` |
| Phone on Wi-Fi, `http://<PC IP>:5173` | The phone's browser. Served by the PC, but nothing is stored on the PC. If the PC's IP changes, the address changes and the phone starts empty again |
| Vercel (`https://….vercel.app`) | Each visitor's own browser, for that domain |

If you host the built app (for example on Vercel), nothing changes about storage: there is no server or database, so each person's data lives only in their own browser on their own machine. It isn't shared between users, doesn't sync across devices or browsers, and is lost if they clear site data. The JSON/CSV export is the way to back it up or hand it over.
