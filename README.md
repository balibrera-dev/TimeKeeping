# BALISOFT TimeKeeping

A local time-tracking and multitasking dashboard for BALISOFT developers and BI analysts. React + Vite + Tailwind CSS + Lucide icons, running on `localhost`. All data stays in your browser's `localStorage`.

## Setup

Requires Node.js 20.19+ (or 22+).

```bash
npm install
npm run dev      # opens http://localhost:5173
```

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
- **Call / Break / Lunch**: one click in the header stops current work and tracks the interruption as its own entry (a call asks for a name and optional client). *Back to …* ends it and resumes the task you were on; *End* just stops. Find them under *Calls & breaks* in the task list.
- **Controls**: Start / Pause / Resume / Done / Reset on every task. <kbd>Space</kbd> pauses the active task (or ends a call and resumes), or resumes the last one.
- **Comments**: one comment per subtask (tasks without subtasks have one task comment), with a one-click timestamp. **Improve with AI** rewrites a comment with Claude to make it clearer, with *Undo AI*. Add your Anthropic API key under the gear icon (Settings); it is stored only in this browser and only sent to the Anthropic API.
- **Calendar**: Outlook-style Day and Week views with your tracked sessions as blocks (labelled with the subtask), a live "now" line, per-day totals, and click-a-day to drill in. Side panel shows total tracked, sessions, per-task and per-client breakdowns, and progress against subtask estimates.
- **Export**: CSV or JSON of the shown day's sessions (today by default) with client, task, subtask, type (task / call / break / lunch) and comment, for timesheets.
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

## Data

Stored under the `balisoft-timekeeping:v1` key in `localStorage` (data from earlier versions is upgraded automatically). AI settings are kept separately under `balisoft-timekeeping:ai`. Clearing site data for `localhost:5173` wipes it, so export regularly if you need a record. Changes made in one tab show up in other open tabs of the app.
