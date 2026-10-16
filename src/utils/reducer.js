import { uid } from './id.js';
import { INTERRUPTIONS } from '../types/index.js';

export const STATE_VERSION = 2;

export const DEFAULT_SETTINGS = {
  allowTimeEdits: true,
  /** Ping when the running subtask is about to reach its estimate. */
  alertSound: true,
  /** Desktop notification for the same alert (needs browser permission). */
  alertNotify: false,
  /** How many minutes before the estimate to alert. */
  alertLeadMinutes: 2,
  /** At the estimate: 'stay' keeps the timer running, 'next' checks the subtask off and moves on. */
  onEstimate: 'stay',
};

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
  return { version: STATE_VERSION, templates: defaultTemplates(now), tasks: [], clients: [], settings: { ...DEFAULT_SETTINGS } };
}

function newTask(fields, now) {
  return {
    id: fields.id ?? uid(),
    title: fields.title.trim(),
    category: fields.category || 'Other',
    kind: fields.kind ?? 'task',
    interruptType: fields.interruptType ?? null,
    resumeTaskId: fields.resumeTaskId ?? null,
    clientId: fields.clientId || null,
    templateId: fields.templateId ?? null,
    status: 'idle',
    subtasks: (fields.subtasks ?? []).map((s) => ({
      id: uid(),
      title: s.title,
      estimate: Number(s.estimate) || 0,
      done: false,
      notes: '',
    })),
    currentSubtaskId: null,
    logs: [],
    activeStart: null,
    notes: '',
    createdAt: now,
    completedAt: null,
  };
}

/**
 * Close the open session of a task, if any. The closed log records which
 * subtask the time belonged to. Status becomes `nextStatus` (default paused).
 */
function closeSession(task, now, nextStatus = 'paused') {
  if (task.activeStart == null) return { ...task, status: nextStatus };
  const startTime = task.activeStart;
  const endTime = Math.max(now, startTime);
  const logs =
    endTime > startTime
      ? [...task.logs, { startTime, endTime, duration: endTime - startTime, subtaskId: task.currentSubtaskId ?? null }]
      : task.logs;
  return { ...task, logs, activeStart: null, status: nextStatus };
}

/** Stop a running task because something else takes over. Interruptions end for good. */
function stopRunning(task, now) {
  if (task.kind === 'interruption') return { ...closeSession(task, now, 'completed'), completedAt: now };
  return closeSession(task, now, 'paused');
}

/**
 * Re-point the running session of a task at another subtask: the time so far
 * is logged against the old subtask and a new session opens on the new one.
 */
function moveRunningSubtask(task, subtaskId, now) {
  if (task.currentSubtaskId === subtaskId) return task;
  if (task.status !== 'active' || task.activeStart == null) return { ...task, currentSubtaskId: subtaskId };
  return { ...closeSession(task, now, 'active'), activeStart: now, currentSubtaskId: subtaskId };
}

/** Which subtask should receive time when a task starts. */
function pickSubtask(task, requested) {
  if (requested !== undefined) {
    return requested === null || task.subtasks.some((s) => s.id === requested) ? requested : null;
  }
  const current = task.subtasks.find((s) => s.id === task.currentSubtaskId);
  if (current && !current.done) return current.id;
  return task.subtasks.find((s) => !s.done)?.id ?? null;
}

function nextOpenSubtask(task, afterId) {
  const idx = task.subtasks.findIndex((s) => s.id === afterId);
  const ordered = [...task.subtasks.slice(idx + 1), ...task.subtasks.slice(0, Math.max(0, idx))];
  return ordered.find((s) => !s.done && s.id !== afterId)?.id ?? null;
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

    // ---- Clients ---------------------------------------------------------
    case 'CLIENT_SAVE': {
      const c = action.client;
      const exists = state.clients.some((x) => x.id === c.id);
      return {
        ...state,
        clients: exists
          ? state.clients.map((x) => (x.id === c.id ? { ...x, ...c } : x))
          : [...state.clients, { ...c, id: c.id ?? uid(), createdAt: action.now }],
      };
    }
    case 'CLIENT_DELETE':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.id),
        tasks: state.tasks.map((t) => (t.clientId === action.id ? { ...t, clientId: null } : t)),
      };

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
      const task = newTask(action, action.now);
      const next = { ...state, tasks: [task, ...state.tasks] };
      return action.startNow ? reducer(next, { type: 'TASK_START', id: task.id, now: action.now }) : next;
    }
    case 'TASK_UPDATE':
      return mapTask(state, action.id, (t) => ({ ...t, ...action.patch }));
    case 'TASK_DELETE':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    // ---- Timer engine ----------------------------------------------------
    /**
     * Start (or switch to) a task, optionally on a specific subtask. Atomic:
     * any other running task has its session closed and becomes paused in the
     * same update, so there is never more than one active timer. Starting the
     * already-running task on a different subtask splits its session there.
     */
    case 'TASK_START': {
      const target = state.tasks.find((t) => t.id === action.id);
      if (!target) return state;
      if (target.status === 'active') {
        if (action.subtaskId === undefined || action.subtaskId === target.currentSubtaskId) return state;
        return mapTask(state, target.id, (t) => moveRunningSubtask(t, pickSubtask(t, action.subtaskId), action.now));
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => {
          if (t.id === action.id) {
            return {
              ...t,
              status: 'active',
              activeStart: action.now,
              completedAt: null,
              currentSubtaskId: pickSubtask(t, action.subtaskId),
            };
          }
          if (t.status === 'active' || t.activeStart != null) return stopRunning(t, action.now);
          return t;
        }),
      };
    }
    case 'TASK_PAUSE':
      return mapTask(state, action.id, (t) => (t.status === 'active' ? stopRunning(t, action.now) : t));
    case 'PAUSE_ALL':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.status === 'active' ? stopRunning(t, action.now) : t)),
      };
    case 'TASK_RESET':
      return mapTask(state, action.id, (t) => ({ ...t, status: 'idle', logs: [], activeStart: null, completedAt: null }));
    case 'TASK_COMPLETE':
      return mapTask(state, action.id, (t) => ({ ...closeSession(t, action.now, 'completed'), completedAt: action.now }));
    case 'TASK_REOPEN':
      return mapTask(state, action.id, (t) => ({ ...t, status: t.logs.length ? 'paused' : 'idle', completedAt: null }));

    // ---- Interruptions (call / break / lunch) ----------------------------
    /**
     * Stop whatever is running and track time against a new interruption.
     * Remembers the interrupted task so it can be resumed when this ends. If
     * another interruption was running, the original task is carried over.
     */
    case 'INTERRUPT_START': {
      const kind = INTERRUPTIONS[action.interruptType] ? action.interruptType : 'call';
      const running = state.tasks.find((t) => t.status === 'active');
      const resumeTaskId = running ? (running.kind === 'interruption' ? running.resumeTaskId : running.id) : null;
      const task = newTask(
        {
          id: action.id,
          title: action.title?.trim() || INTERRUPTIONS[kind].label,
          category: INTERRUPTIONS[kind].category,
          kind: 'interruption',
          interruptType: kind,
          resumeTaskId,
          clientId: action.clientId,
        },
        action.now,
      );
      return reducer({ ...state, tasks: [task, ...state.tasks] }, { type: 'TASK_START', id: task.id, now: action.now });
    }
    case 'INTERRUPT_END': {
      const it = state.tasks.find((t) => t.id === action.id);
      if (!it) return state;
      const ended = mapTask(state, it.id, (t) => ({ ...closeSession(t, action.now, 'completed'), completedAt: action.now }));
      const resume = action.resume && ended.tasks.find((t) => t.id === it.resumeTaskId && t.status !== 'completed');
      return resume ? reducer(ended, { type: 'TASK_START', id: resume.id, now: action.now }) : ended;
    }

    // ---- Subtasks & notes -------------------------------------------------
    case 'SUBTASK_TOGGLE':
      return mapTask(state, action.taskId, (t) => {
        const target = t.subtasks.find((s) => s.id === action.subtaskId);
        if (!target) return t;
        // Reopening a subtask drops any manual time so tracking picks up from the real total.
        const toggled = {
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === target.id ? { ...s, done: !s.done, timeOverride: s.done ? null : s.timeOverride ?? null } : s)),
        };
        // Finishing the subtask the timer is on moves the timer to the next open one.
        if (!target.done && t.currentSubtaskId === target.id && t.status === 'active') {
          return moveRunningSubtask(toggled, nextOpenSubtask(toggled, target.id), action.now);
        }
        return toggled;
      });
    case 'SUBTASK_ADD':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: [...t.subtasks, { id: uid(), title: action.title, estimate: Number(action.estimate) || 0, done: false, notes: '' }],
      }));
    case 'SUBTASK_REMOVE':
      return mapTask(state, action.taskId, (t) => {
        const moved = t.currentSubtaskId === action.subtaskId ? moveRunningSubtask(t, nextOpenSubtask(t, action.subtaskId), action.now) : t;
        return { ...moved, subtasks: moved.subtasks.filter((s) => s.id !== action.subtaskId) };
      });
    case 'SUBTASK_NOTES_SET':
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === action.subtaskId ? { ...s, notes: action.notes } : s)),
      }));
    case 'SUBTASK_TIME_SET': {
      // Manual totals are only for completed subtasks, and only while the setting allows it.
      if (!(state.settings ?? DEFAULT_SETTINGS).allowTimeEdits) return state;
      const ms = action.ms == null ? null : Math.max(0, Math.round(action.ms));
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === action.subtaskId && s.done ? { ...s, timeOverride: ms } : s)),
      }));
    }
    case 'SETTINGS_UPDATE':
      return { ...state, settings: { ...DEFAULT_SETTINGS, ...state.settings, ...action.patch } };
    case 'NOTES_SET':
      return mapTask(state, action.id, (t) => ({ ...t, notes: action.notes }));

    default:
      return state;
  }
}

/** Defensive load: anything malformed falls back to a fresh state. Also upgrades v1 data. */
export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks) || !Array.isArray(raw.templates)) return null;
  const tasks = raw.tasks.map((t) => ({
    notes: '',
    logs: [],
    activeStart: null,
    completedAt: null,
    templateId: null,
    category: 'Other',
    kind: 'task',
    interruptType: null,
    resumeTaskId: null,
    clientId: null,
    currentSubtaskId: null,
    ...t,
    subtasks: (t.subtasks ?? []).map((s) => ({ notes: '', done: false, estimate: 0, timeOverride: null, ...s })),
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
  const clients = Array.isArray(raw.clients) ? raw.clients.filter((c) => c && c.id && c.name) : [];
  const settings = { ...DEFAULT_SETTINGS, ...(raw.settings && typeof raw.settings === 'object' ? raw.settings : {}) };
  return { version: STATE_VERSION, templates: raw.templates, tasks, clients, settings };
}
