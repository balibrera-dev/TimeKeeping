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

- **Templates**: reusable blueprints (title, category, subtasks with default estimates in minutes). Create, edit, duplicate, delete. Three starter templates are seeded on first run: *New Development*, *Add Visual to Existing Report*, *Fix Data Pipeline Issue*.
- **Tasks**: create from a template (copies its checklist and estimates, which you can tweak) or ad-hoc. Check off subtasks, add or remove them, and see time spent against the estimate.
- **One-click switch**: the sticky header always shows the active task. *Switch* (or press <kbd>S</kbd> anywhere) pauses the running timer and starts the chosen task in one atomic update. Type a new name in the switcher to create an ad-hoc task and start it immediately. Only one timer can run at a time.
- **Controls**: Start / Pause / Resume / Done / Reset on every task. <kbd>Space</kbd> pauses the active task or resumes the last one.
- **Notes / context log**: per-task notes for blockers ("Waiting on data warehouse access"), with a one-click timestamp.
- **Calendar**: Outlook-style Day and Week views with your tracked sessions as blocks, a live "now" line, per-day totals, and click-a-day to drill in. Side panel shows total tracked, sessions, per-task breakdown and progress against subtask estimates.
- **Export**: CSV or JSON of the shown day's sessions (today by default) for timesheets.
- **Light / dark theme** toggle.

## How time is measured

Elapsed time is always computed from `Date.now()` timestamps (`sum(closed sessions) + (now − activeStart)`). The 1-second interval only re-renders the UI, so backgrounded tabs, sleep, or a laggy machine never cause drift. A running timer survives a page refresh or browser restart. Sessions that cross midnight are split across days in the calendar and exports.

## Project layout

```
src/
  components/   UI: ActiveBar, SwitchMenu, TasksView, TaskCard, TemplatesView, CalendarView, CalendarGrid, MetricsPanel, ui primitives
  hooks/        useTracker (state + persistence + cross-tab sync), useNow (clock), useTheme
  types/        JSDoc data shapes (Template, Task, TimeLog)
  utils/        reducer (timer engine), sessions (math), export (CSV/JSON), storage, time formatting
```

## Data

Stored under the `balisoft-timekeeping:v1` key in `localStorage`. Clearing site data for `localhost:5173` wipes it, so export regularly if you need a record. Changes made in one tab show up in other open tabs of the app.
