import { uid } from './id.js';

export const STATE_VERSION = 1;

/** Starter templates so the first run isn't empty. Users can edit or delete them. */
export function defaultTemplates(now = Date.now()) {
  const t = (title, category, subtasks) => ({
    id: uid(),
    title,
    category,
    createdAt: now,
    subtasks: subtasks.map(([st, estimate]) => ({ id: uid(), title: st, estimate })),
  });
  return [
    t('New Development', 'Development', [
      ['Gather requirements', 30],
      ['Get data', 60],
      ['Implement data model', 90],
      ['Create measures / metrics', 60],
      ['Build report', 120],
      ['Get approval', 30],
    ]),
    t('Add Visual to Existing Report', 'Reporting', [
      ['Review current report', 15],
      ['Create / adjust measures', 30],
      ['Build visual', 45],
      ['Validate numbers', 20],
      ['Publish & get approval', 15],
    ]),
    t('Fix Data Pipeline Issue', 'Data Engineering', [
      ['Reproduce & check logs', 30],
      ['Identify root cause', 45],
      ['Implement fix', 60],
      ['Backfill / reprocess data', 30],
      ['Verify downstream reports', 20],
    ]),
  ];
}

/** @returns {import('../types').TrackerState} */
export function initialState(now = Date.now()) {
  return { version: STATE_VERSION, templates: defaultTemplates(now), tasks: [] };
}

/** Close the open session of a task, if any, returning the updated task. */
function closeSession(task, now, nextStatus) {
  if (task.activeStart == null) return { ...task, status: nextStatus ?? task.status };
  const startTime = task.activeStart;
  const endTime = Math.max(now, startTime);
  const logs = endTime > startTime ? [...task.logs, { startTime, endTime, duration: endTime - startTime }] : task.logs;
  return { ...task, logs, activeStart: null, status: nextStatus ?? 'paused' };
}

function mapTask(state, id, fn) {
  return { ...state, tasks: state.tasks.map((t) => (t.id === id ? fn(t) : t)) };
}

/**
 * Pure state reducer. Every time-related action carries `now` so the reducer
 * stays deterministic and testable.
 * @param {import('../types').TrackerState} state
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    // ---- Templates -------------------------------------------------------
    case 'TEMPLATE_SAVE': {
      const tpl = action.template;
      const exists = state.templates.some((t) => t.id === tpl.id);
      return {
        ...state,
        templates: exists
          ? state.templates.map((t) => (t.id === tpl.id ? tpl : t))
          : [...state.templates, { ...tpl, id: tpl.id ?? uid(), createdAt: action.now }],
      };
    }
    case 'TEMPLATE_DELETE':
      return { ...state, templates: state.templates.filter((t) => t.id !== action.id) };

    // ---- Tasks -----------------------------------------------------------
    case 'TASK_CREATE': {
      const { title, category, templateId, subtasks, startNow } = action;
      const task = {
        id: action.id ?? uid(),
        title: title.trim(),
        category: category || 'Other',
        templateId: templateId ?? null,
        status: 'idle',
        subtasks: (subtasks ?? []).map((s) => ({ id: uid(), title: s.title, estimate: Number(s.estimate) || 0, done: false })),
        logs: [],
        activeStart: null,
        notes: '',
        createdAt: action.now,
        completedAt: null,
      };
      const next = { ...state, tasks: [task, ...state.tasks] };
      return startNow ? reducer(next, { type: 'TASK_START', id: task.id, now: action.now }) : next;
    }
    case 'TASK_UPDATE':
      return mapTask(state, action.id, (t) => ({ ...t, ...action.patch }));
    case 'TASK_DELETE':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    // ---- Timer engine ----------------------------------------------------
    /**
     * Start (or switch to) a task. Atomic: any other running task has its
     * session closed and becomes paused in the same update, so there is never
     * more than one active timer.
     */
    case 'TASK_START': {
      const target = state.tasks.find((t) => t.id === action.id);
      if (!target || target.status === 'active') return state;
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id === action.id) {
            return { ...t, status: 'active', activeStart: action.now, completedAt: null };
          }
          if (t.status === 'active' || t.activeStart != null) return closeSession(t, action.now, 'paused');
          return t;
        }),
      };
    }
    case 'TASK_PAUSE':
      return mapTask(state, action.id, (t) => (t.status === 'active' ? closeSession(t, action.now, 'paused') : t));
    case 'PAUSE_ALL':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.status === 'active' ? closeSession(t, action.now, 'paused') : t)),
      };
    case 'TASK_RESET':
      return mapTask(state, action.id, (t) => ({ ...t, status: 'idle', logs: [], activeStart: null, completedAt: null }));
    case 'TASK_COMPLETE':
      return mapTask(state, action.id, (t) => ({ ...closeSession(t, action.now, 'completed'), completedAt: action.now }));
    case 'TASK_REOPEN':
      return mapTask(state, action.id, (t) => ({ ...t, status: t.logs.length ? 'paused' : 'idle', completedAt: null }));

    // ---- Subtasks & notes -------------------------------------------------
    case 'SUBTASK_TOGGLE':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === action.subtaskId ? { ...s, done: !s.done } : s)),
      }));
    case 'SUBTASK_ADD':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: [...t.subtasks, { id: uid(), title: action.title, estimate: Number(action.estimate) || 0, done: false }],
      }));
    case 'SUBTASK_REMOVE':
      return mapTask(state, action.taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== action.subtaskId) }));
    case 'NOTES_SET':
      return mapTask(state, action.id, (t) => ({ ...t, notes: action.notes }));

    default:
      return state;
  }
}

/** Defensive load: anything malformed falls back to a fresh state. */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks) || !Array.isArray(raw.templates)) return null;
  const tasks = raw.tasks.map((t) => ({
    notes: '',
    subtasks: [],
    logs: [],
    activeStart: null,
    completedAt: null,
    templateId: null,
    category: 'Other',
    ...t,
  }));
  // Enforce the single-active-timer rule even if storage was edited by hand.
  let seenActive = false;
  for (const t of tasks) {
    if (t.status === 'active' && t.activeStart != null && !seenActive) {
      seenActive = true;
    } else if (t.status === 'active' || t.activeStart != null) {
      t.status = 'paused';
      t.activeStart = null;
    }
  }
  return { version: STATE_VERSION, templates: raw.templates, tasks };
}
