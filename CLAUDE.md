# Project: BALISOFT Time-Tracking & Multitasking Engine (Local React)

## 1. Project Overview & Philosophy

- **Goal:** Build a lightning-fast, highly reliable local time-tracking and multitasking web application for BALISOFT developers and business intelligence analysts.
- **Environment:** React, Vite, Tailwind CSS, Lucide React icons, running strictly on `localhost`.
- **Core UX Priority:** Zero friction. Switching tasks must be a single click (auto-pausing the old timer and starting the new one).

## 2. Technical Stack & Conventions

- **Framework:** React (functional components, custom hooks).
- **Styling:** Tailwind CSS. Use professional, clean layouts aligned with BALISOFT standards, featuring clear visual status indicators (e.g., emerald for active states, amber for paused, slate for completed).
- **Icons:** `lucide-react` for all UI icons.
- **Persistence:** All state (templates, tasks, active timers, time logs) **must** persist in browser `localStorage`.
- **Date/Time Handling:** Use timestamps (`Date.now()`) for all timer calculations to prevent drift when tabs are backgrounded or the machine lags. Do not rely solely on `setInterval` tick-incrementing for elapsed time math.

## 3. Architecture & Data Structures

### Templates & Tasks

- **Templates:** Reusable blueprints containing a title, category, and an array of subtasks (each with a default estimated duration in minutes).
- **Tasks:** Instantiated from templates or created ad-hoc. Contain a status (`idle`, `active`, `paused`, `completed`), a checklist of subtasks, and an array of time log entries (`{ startTime, endTime, duration }`).

### State Rules

- Only **one** task can have an `active` timer at any given moment.
- Triggering a "Switch Task" action must execute an atomic state update:
  1. Close out the active session log for the currently running task (calculate elapsed time via timestamp and push to its logs).
  2. Set the old task status to `paused`.
  3. Set the new task status to `active` and open a new session log timestamp.

## 4. Coding Guidelines for AI Generations

- **Modularity:** Keep files organized cleanly (e.g., `/components`, `/hooks`, `/types`, `/utils`). Avoid massive multi-thousand-line single files unless specifically requested.
- **Self-Contained:** Every code block provided should be fully functional, including necessary imports and Tailwind classes. Do not use placeholders like `// TODO: implement logic here`.
- **Error Handling & Edge Cases:** Ensure graceful handling of empty states (e.g., no templates created yet, zero hours logged today) with helpful empty-state UI prompts.
- **Export Utility:** Always include a JSON/CSV export feature for the day's time logs.

## 5. Directory Structure Reference

## 6. Project Info File (`project-info.json`)

- `project-info.json` at the repo root is this project's fact sheet (name, status, stack, links, services, accounts) plus a `dev` section with everything a developer needs: Node version, port, scripts, env var names, localStorage keys, deploy flow, key files.
- **Keep it updated in the same change:** whenever you add, change or remove a service, link, domain, account or part of the stack, update `project-info.json` in that same commit/PR. The same goes for scripts, env vars, ports, deploy flow or anything else in its `dev` section.
- Never put keys, tokens or passwords in it. `account` holds only an email, username or team.
- If a value isn't known, leave it as an empty string instead of guessing.
- `provider` is one of `vercel`, `supabase`, `mongo`, `cloudflare`, `resend`, `github`, `other`; `status` is one of `active`, `paused`, `archived`.
