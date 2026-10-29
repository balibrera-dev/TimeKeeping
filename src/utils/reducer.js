import { uid } from './id.js';
import { INTERRUPTIONS } from '../types/index.js';

export const STATE_VERSION = 2;

export const DEFAULT_SETTINGS = {
  allowTimeEdits: true,
  estimateAlerts: true,
  alertLeadMinutes: 1,
  onEstimateReached: 'stay',
  alertSound: true,
  desktopNotifications: false,
  runningOnTop: true,
  jiraDomain: '',
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
  return { version: STATE_VERSION, templates: defaultTemplates(now), tasks: [], clients: [], settings: { ...DEFAULT_SETTINGS }, subtaskOrder: [] };
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
      jira: '',
    })),
    currentSubtaskId: null,
    logs: [],
    activeStart: null,
    notes: '',
    jira: '',
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

/** True when a session's time isn't on any current subtask (none, or one that was removed). */
function isUnassigned(task, subtaskId) {
  return subtaskId == null || !task.subtasks.some((s) => s.id === subtaskId);
}

/**
 * Put `ids` (a subset of `items`, in their new order) back into the slots
 * those items held, leaving every other item where it was.
 */
function reorderSubset(items, ids) {
  const wanted = ids.filter((id) => items.some((it) => it.id === id));
  const set = new Set(wanted);
  const byId = new Map(items.map((it) => [it.id, it]));
  let i = 0;
  return items.map((it) => (set.has(it.id) ? byId.get(wanted[i++]) : it));
}

/**
 * Subtask ids in the order the Subtasks page shows them. Starts as task order
 * (then subtask order); once rows are dragged, `state.subtaskOrder` wins and
 * subtasks added later slot in right after their previous sibling.
 * @returns {string[]}
 */
export function subtaskViewOrder(state) {
  const natural = state.tasks.filter((t) => t.kind !== 'interruption').flatMap((t) => t.subtasks.map((s) => s.id));
  const exists = new Set(natural);
  const order = (state.subtaskOrder ?? []).filter((id) => exists.has(id));
  if (!order.length) return natural;
  const placed = new Set(order);
  let prev = null;
  for (const id of natural) {
    if (!placed.has(id)) {
      order.splice(prev == null ? 0 : order.indexOf(prev) + 1, 0, id);
      placed.add(id);
    }
    prev = id;
  }
  return order;
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
    case 'TASK_RENAME': {
      const title = action.title?.trim();
      return title ? mapTask(state, action.id, (t) => ({ ...t, title })) : state;
    }
    /** Manual order: `ids` are the dragged list's tasks in their new order. */
    case 'TASK_REORDER':
      return { ...state, tasks: reorderSubset(state.tasks, action.ids ?? []) };
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
        subtasks: [...t.subtasks, { id: uid(), title: action.title, estimate: Number(action.estimate) || 0, done: false, notes: '', jira: '' }],
      }));
    case 'SUBTASK_REMOVE':
      return mapTask(state, action.taskId, (t) => {
        const moved = t.currentSubtaskId === action.subtaskId ? moveRunningSubtask(t, nextOpenSubtask(t, action.subtaskId), action.now) : t;
        return { ...moved, subtasks: moved.subtasks.filter((s) => s.id !== action.subtaskId) };
      });
    case 'SUBTASK_RENAME': {
      const title = action.title?.trim();
      if (!title) return state;
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === action.subtaskId ? { ...s, title } : s)),
      }));
    }

    /** Edit a subtask's name, estimate (minutes) and/or Jira key. Blank names are ignored. */
    case 'SUBTASK_EDIT': {
      const title = action.title?.trim();
      const estimate = action.estimate == null ? null : Math.max(0, Math.round(Number(action.estimate) || 0));
      const patch = { ...(title ? { title } : {}), ...(estimate == null ? {} : { estimate }), ...(action.jira == null ? {} : { jira: action.jira }) };
      return mapTask(state, action.taskId, (t) => ({
        ...t,
        subtasks: t.subtasks.map((s) => (s.id === action.subtaskId ? { ...s, ...patch } : s)),
      }));
    }
    /** Manual order of the Subtasks page: `ids` are the dragged rows in their new order. */
    case 'SUBTASK_VIEW_REORDER':
      return { ...state, subtaskOrder: reorderSubset(subtaskViewOrder(state).map((id) => ({ id })), action.ids ?? []).map((it) => it.id) };
    case 'SUBTASK_REORDER':
      return mapTask(state, action.taskId, (t) => ({ ...t, subtasks: reorderSubset(t.subtasks, action.ids ?? []) }));

    // ---- "Not on a subtask" time ------------------------------------------
    /**
     * Drop the time that isn't on any subtask. A running session that isn't on
     * a subtask restarts from `now`, so its time so far is dropped too.
     */
    case 'UNASSIGNED_REMOVE':
      return mapTask(state, action.taskId, (t) => {
        const logs = t.logs.filter((l) => !isUnassigned(t, l.subtaskId));
        const restart = t.activeStart != null && isUnassigned(t, t.currentSubtaskId);
        const status = t.status === 'paused' && logs.length === 0 ? 'idle' : t.status;
        return { ...t, logs, status, activeStart: restart ? action.now : t.activeStart };
      });
    /** Turn the time that isn't on any subtask into a new subtask that owns it. */
    case 'UNASSIGNED_TO_SUBTASK': {
      const title = action.title?.trim();
      if (!title) return state;
      return mapTask(state, action.taskId, (t) => {
        const id = action.subtaskId ?? uid();
        const subtask = { id, title, estimate: Number(action.estimate) || 0, done: false, notes: '', jira: '', timeOverride: null };
        const logs = t.logs.map((l) => (isUnassigned(t, l.subtaskId) ? { ...l, subtaskId: id } : l));
        const currentSubtaskId = t.activeStart != null && isUnassigned(t, t.currentSubtaskId) ? id : t.currentSubtaskId;
        return { ...t, logs, currentSubtaskId, subtasks: [...t.subtasks, subtask] };
      });
    }
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
    // One Jira key per task now; older data had a Story and a Parent (Story wins).
    jira: t.jira ?? (t.jiraStory || t.jiraParent || ''),
    subtasks: (t.subtasks ?? []).map((s) => ({ notes: '', done: false, estimate: 0, timeOverride: null, jira: '', ...s })),
  }));
  for (const t of tasks) {
    delete t.jiraStory;
    delete t.jiraParent;
  }
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
  const subtaskOrder = Array.isArray(raw.subtaskOrder) ? raw.subtaskOrder.filter((id) => typeof id === 'string') : [];
  return { version: STATE_VERSION, templates: raw.templates, tasks, clients, settings, subtaskOrder };
}
