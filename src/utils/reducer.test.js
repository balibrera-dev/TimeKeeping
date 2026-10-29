import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, sanitizeState } from './reducer.js';
import { taskElapsed, sessionsForDay, subtaskTotals } from './sessions.js';
import { toCSV, dayLogRows } from './export.js';
import { parseDuration } from './time.js';

const T0 = new Date(2026, 9, 14, 9, 0, 0).getTime();
const MIN = 60_000;

function withTasks(...titles) {
  let s = { ...initialState(T0), tasks: [] };
  for (const [i, title] of titles.entries()) {
    s = reducer(s, { type: 'TASK_CREATE', id: `t${i + 1}`, title, category: 'Development', subtasks: [], now: T0 });
  }
  return s;
}

const byId = (s, id) => s.tasks.find((t) => t.id === id);

test('switching closes the running session and starts the next one atomically', () => {
  let s = withTasks('A', 'B');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 });
  s = reducer(s, { type: 'TASK_START', id: 't2', now: T0 + 25 * MIN });

  const a = byId(s, 't1');
  const b = byId(s, 't2');
  assert.equal(a.status, 'paused');
  assert.equal(a.activeStart, null);
  assert.deepEqual(a.logs, [{ startTime: T0, endTime: T0 + 25 * MIN, duration: 25 * MIN, subtaskId: null }]);
  assert.equal(b.status, 'active');
  assert.equal(b.activeStart, T0 + 25 * MIN);
  assert.equal(s.tasks.filter((t) => t.status === 'active').length, 1);
});

test('elapsed time comes from timestamps, not ticks', () => {
  let s = withTasks('A');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 });
  // Simulates a backgrounded tab: no ticks, then read 2h later.
  assert.equal(taskElapsed(byId(s, 't1'), T0 + 120 * MIN), 120 * MIN);
});

test('pause, resume, complete and reset', () => {
  let s = withTasks('A');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 });
  s = reducer(s, { type: 'TASK_PAUSE', id: 't1', now: T0 + 10 * MIN });
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 + 20 * MIN });
  s = reducer(s, { type: 'TASK_COMPLETE', id: 't1', now: T0 + 25 * MIN });
  const a = byId(s, 't1');
  assert.equal(a.status, 'completed');
  assert.equal(taskElapsed(a, T0 + 99 * MIN), 15 * MIN);
  s = reducer(s, { type: 'TASK_RESET', id: 't1' });
  assert.equal(byId(s, 't1').status, 'idle');
  assert.equal(byId(s, 't1').logs.length, 0);
});

test('starting the already active task is a no-op', () => {
  let s = withTasks('A');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 });
  const again = reducer(s, { type: 'TASK_START', id: 't1', now: T0 + MIN });
  assert.equal(again, s);
});

test('create from template copies subtasks and can start immediately', () => {
  let s = initialState(T0);
  const tpl = s.templates[0];
  s = reducer(s, { type: 'TASK_CREATE', id: 'x', title: tpl.title, category: tpl.category, templateId: tpl.id, subtasks: tpl.subtasks, startNow: true, now: T0 });
  const x = byId(s, 'x');
  assert.equal(x.subtasks.length, tpl.subtasks.length);
  assert.ok(x.subtasks.every((st) => st.done === false));
  assert.equal(x.status, 'active');
});

test('sessions crossing midnight are split per day', () => {
  const late = new Date(2026, 9, 14, 23, 30).getTime();
  let s = withTasks('A');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: late });
  s = reducer(s, { type: 'TASK_PAUSE', id: 't1', now: late + 60 * MIN });
  const day1 = sessionsForDay(s.tasks, late, late + 61 * MIN);
  const day2 = sessionsForDay(s.tasks, late + 60 * MIN, late + 61 * MIN);
  assert.equal(day1[0].duration, 30 * MIN);
  assert.equal(day2[0].duration, 30 * MIN);
});

test('sanitizeState keeps at most one active timer', () => {
  const raw = {
    templates: [],
    tasks: [
      { id: 'a', title: 'A', status: 'active', activeStart: T0, logs: [], subtasks: [] },
      { id: 'b', title: 'B', status: 'active', activeStart: T0, logs: [], subtasks: [] },
    ],
  };
  const s = sanitizeState(raw);
  assert.equal(s.tasks.filter((t) => t.status === 'active').length, 1);
  assert.equal(sanitizeState({ nope: true }), null);
});

test('CSV export escapes commas and quotes', () => {
  let s = withTasks('Fix "ETL", part 2');
  s = reducer(s, { type: 'TASK_START', id: 't1', now: T0 });
  s = reducer(s, { type: 'TASK_PAUSE', id: 't1', now: T0 + 30 * MIN });
  const rows = dayLogRows(s.tasks, T0, T0 + 31 * MIN);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].durationMinutes, 30);
  assert.match(toCSV(rows), /"Fix ""ETL"", part 2"/);
});

function withSubtasks() {
  let s = { ...initialState(T0), tasks: [] };
  s = reducer(s, {
    type: 'TASK_CREATE',
    id: 'r',
    title: 'Report',
    category: 'Reporting',
    subtasks: [
      { title: 'Get data', estimate: 30 },
      { title: 'Build visual', estimate: 45 },
      { title: 'Approval', estimate: 15 },
    ],
    now: T0,
  });
  return s;
}

test('creating a task does not start it', () => {
  const s = withTasks('A');
  assert.equal(byId(s, 't1').status, 'idle');
  assert.equal(s.tasks.filter((t) => t.status === 'active').length, 0);
});

test('time is allocated to the selected subtask and the task total is the sum', () => {
  let s = withSubtasks();
  const [a, b] = byId(s, 'r').subtasks;
  s = reducer(s, { type: 'TASK_START', id: 'r', now: T0 });
  assert.equal(byId(s, 'r').currentSubtaskId, a.id, 'defaults to the first open subtask');
  // Clicking another subtask while running moves the timer there.
  s = reducer(s, { type: 'TASK_START', id: 'r', subtaskId: b.id, now: T0 + 20 * MIN });
  const r = byId(s, 'r');
  assert.equal(r.status, 'active');
  assert.equal(r.currentSubtaskId, b.id);
  assert.equal(r.activeStart, T0 + 20 * MIN);
  const totals = subtaskTotals(r, T0 + 30 * MIN);
  assert.equal(totals.get(a.id), 20 * MIN);
  assert.equal(totals.get(b.id), 10 * MIN);
  assert.equal(taskElapsed(r, T0 + 30 * MIN), 30 * MIN);
});

test('starting a paused task on a subtask switches away from the running one', () => {
  let s = withSubtasks();
  s = reducer(s, { type: 'TASK_CREATE', id: 'o', title: 'Other', subtasks: [], now: T0 });
  const c = byId(s, 'r').subtasks[2];
  s = reducer(s, { type: 'TASK_START', id: 'o', now: T0 });
  s = reducer(s, { type: 'TASK_START', id: 'r', subtaskId: c.id, now: T0 + 5 * MIN });
  assert.equal(byId(s, 'o').status, 'paused');
  assert.equal(byId(s, 'r').currentSubtaskId, c.id);
});

test('checking off the running subtask moves the timer to the next open one', () => {
  let s = withSubtasks();
  const [a, b] = byId(s, 'r').subtasks;
  s = reducer(s, { type: 'TASK_START', id: 'r', now: T0 });
  s = reducer(s, { type: 'SUBTASK_TOGGLE', taskId: 'r', subtaskId: a.id, now: T0 + 15 * MIN });
  const r = byId(s, 'r');
  assert.equal(r.currentSubtaskId, b.id);
  assert.deepEqual(r.logs, [{ startTime: T0, endTime: T0 + 15 * MIN, duration: 15 * MIN, subtaskId: a.id }]);
});

test('a call interrupts the running task and resumes it when it ends', () => {
  let s = withSubtasks();
  s = reducer(s, { type: 'TASK_START', id: 'r', now: T0 });
  s = reducer(s, { type: 'INTERRUPT_START', id: 'call', interruptType: 'call', title: 'Standup', now: T0 + 10 * MIN });
  assert.equal(byId(s, 'r').status, 'paused');
  assert.equal(byId(s, 'call').status, 'active');
  assert.equal(byId(s, 'call').resumeTaskId, 'r');
  // Going to lunch straight from the call keeps the original task to resume.
  s = reducer(s, { type: 'INTERRUPT_START', id: 'lunch', interruptType: 'lunch', now: T0 + 40 * MIN });
  assert.equal(byId(s, 'call').status, 'completed');
  assert.equal(byId(s, 'lunch').resumeTaskId, 'r');
  s = reducer(s, { type: 'INTERRUPT_END', id: 'lunch', resume: true, now: T0 + 70 * MIN });
  assert.equal(byId(s, 'lunch').status, 'completed');
  assert.equal(byId(s, 'r').status, 'active');
  assert.equal(taskElapsed(byId(s, 'call'), T0 + 99 * MIN), 30 * MIN);
});

test('deleting a client clears it from its tasks', () => {
  let s = withTasks('A');
  s = reducer(s, { type: 'CLIENT_SAVE', client: { id: 'c1', name: 'Acme', color: '#0ea5e9' }, now: T0 });
  s = reducer(s, { type: 'TASK_UPDATE', id: 't1', patch: { clientId: 'c1' } });
  s = reducer(s, { type: 'CLIENT_DELETE', id: 'c1' });
  assert.equal(s.clients.length, 0);
  assert.equal(byId(s, 't1').clientId, null);
});

test('sanitizeState upgrades v1 data with clients and subtask comments', () => {
  const s = sanitizeState({ templates: [], tasks: [{ id: 'a', title: 'A', status: 'idle', subtasks: [{ id: 's', title: 'S', estimate: 5, done: false }] }] });
  assert.deepEqual(s.clients, []);
  assert.equal(s.tasks[0].subtasks[0].notes, '');
  assert.equal(s.tasks[0].kind, 'task');
});

test('completed subtasks can get a manual total that replaces tracked time', () => {
  let s = withSubtasks();
  const [a, b] = byId(s, 'r').subtasks;
  s = reducer(s, { type: 'TASK_START', id: 'r', now: T0 });
  s = reducer(s, { type: 'TASK_PAUSE', id: 'r', now: T0 + 20 * MIN });

  // Not allowed while the subtask is still open.
  const open = reducer(s, { type: 'SUBTASK_TIME_SET', taskId: 'r', subtaskId: a.id, ms: 45 * MIN });
  assert.equal(byId(open, 'r').subtasks[0].timeOverride ?? null, null);

  s = reducer(s, { type: 'SUBTASK_TOGGLE', taskId: 'r', subtaskId: a.id, now: T0 + 20 * MIN });
  s = reducer(s, { type: 'SUBTASK_TIME_SET', taskId: 'r', subtaskId: a.id, ms: 45 * MIN });
  const r = byId(s, 'r');
  assert.equal(subtaskTotals(r, T0 + 30 * MIN).get(a.id), 45 * MIN);
  assert.equal(subtaskTotals(r, T0 + 30 * MIN).get(b.id) ?? 0, 0);
  assert.equal(taskElapsed(r, T0 + 30 * MIN), 45 * MIN);
  // Calendar sessions are untouched.
  assert.equal(r.logs.reduce((sum, l) => sum + l.duration, 0), 20 * MIN);

  // Reopening the subtask drops the manual total.
  s = reducer(s, { type: 'SUBTASK_TOGGLE', taskId: 'r', subtaskId: a.id, now: T0 + 30 * MIN });
  assert.equal(taskElapsed(byId(s, 'r'), T0 + 30 * MIN), 20 * MIN);
});

test('the setting can lock subtask times', () => {
  let s = withSubtasks();
  const [a] = byId(s, 'r').subtasks;
  s = reducer(s, { type: 'SUBTASK_TOGGLE', taskId: 'r', subtaskId: a.id, now: T0 });
  s = reducer(s, { type: 'SETTINGS_UPDATE', patch: { allowTimeEdits: false } });
  s = reducer(s, { type: 'SUBTASK_TIME_SET', taskId: 'r', subtaskId: a.id, ms: 10 * MIN });
  assert.equal(byId(s, 'r').subtasks[0].timeOverride ?? null, null);
  assert.equal(sanitizeState(JSON.parse(JSON.stringify(s))).settings.allowTimeEdits, false);
  assert.equal(sanitizeState({ tasks: [], templates: [] }).settings.allowTimeEdits, true);
});

test('parseDuration reads common formats', () => {
  assert.equal(parseDuration('1:30'), 90 * MIN);
  assert.equal(parseDuration('0:45:30'), 45 * MIN + 30_000);
  assert.equal(parseDuration('90'), 90 * MIN);
  assert.equal(parseDuration('1.5h'), 90 * MIN);
  assert.equal(parseDuration('1h 30m'), 90 * MIN);
  assert.equal(parseDuration('45m'), 45 * MIN);
  assert.equal(parseDuration('abc'), null);
  assert.equal(parseDuration(''), null);
});

function withOneSubtask() {
  let s = { ...initialState(T0), tasks: [] };
  s = reducer(s, { type: 'TASK_CREATE', id: 't1', title: 'A', subtasks: [{ title: 'Get data', estimate: 30 }], now: T0 });
  return s;
}

test('tasks and subtasks can be renamed; blank names are ignored', () => {
  let s = withOneSubtask();
  const stId = byId(s, 't1').subtasks[0].id;
  s = reducer(s, { type: 'TASK_RENAME', id: 't1', title: '  Sales report  ' });
  s = reducer(s, { type: 'SUBTASK_RENAME', taskId: 't1', subtaskId: stId, title: 'Pull data' });
  assert.equal(byId(s, 't1').title, 'Sales report');
  assert.equal(byId(s, 't1').subtasks[0].title, 'Pull data');
  const same = reducer(s, { type: 'TASK_RENAME', id: 't1', title: '   ' });
  assert.equal(same, s);
});

test('"not on a subtask" time can be turned into a new subtask, live session included', () => {
  let s = withOneSubtask();
  const stId = byId(s, 't1').subtasks[0].id;
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: null, now: T0 });
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: stId, now: T0 + 10 * MIN });
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: null, now: T0 + 30 * MIN });
  s = reducer(s, { type: 'UNASSIGNED_TO_SUBTASK', taskId: 't1', title: 'Meeting', subtaskId: 'new' });

  const t = byId(s, 't1');
  assert.equal(t.subtasks.at(-1).title, 'Meeting');
  assert.equal(t.currentSubtaskId, 'new');
  const totals = subtaskTotals(t, T0 + 40 * MIN);
  assert.equal(totals.get('new'), 20 * MIN);
  assert.equal(totals.get(stId), 20 * MIN);
  assert.equal(totals.has(null), false);
  assert.equal(taskElapsed(t, T0 + 40 * MIN), 40 * MIN);
});

test('removing "not on a subtask" time keeps subtask time and restarts a live unassigned session', () => {
  let s = withOneSubtask();
  const stId = byId(s, 't1').subtasks[0].id;
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: null, now: T0 });
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: stId, now: T0 + 10 * MIN });
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: null, now: T0 + 30 * MIN });
  s = reducer(s, { type: 'UNASSIGNED_REMOVE', taskId: 't1', now: T0 + 40 * MIN });

  const t = byId(s, 't1');
  assert.equal(t.status, 'active');
  assert.equal(t.activeStart, T0 + 40 * MIN);
  assert.equal(taskElapsed(t, T0 + 40 * MIN), 20 * MIN);
  assert.equal(subtaskTotals(t, T0 + 40 * MIN).get(stId), 20 * MIN);
});

test('time left on a removed subtask counts as "not on a subtask" and can be removed', () => {
  let s = withOneSubtask();
  const stId = byId(s, 't1').subtasks[0].id;
  s = reducer(s, { type: 'TASK_START', id: 't1', subtaskId: stId, now: T0 });
  s = reducer(s, { type: 'TASK_PAUSE', id: 't1', now: T0 + 15 * MIN });
  s = reducer(s, { type: 'SUBTASK_REMOVE', taskId: 't1', subtaskId: stId, now: T0 + 15 * MIN });
  s = reducer(s, { type: 'UNASSIGNED_REMOVE', taskId: 't1', now: T0 + 20 * MIN });
  const t = byId(s, 't1');
  assert.equal(t.logs.length, 0);
  assert.equal(t.status, 'idle');
});

test('reordering tasks only moves the dragged ones and keeps the others in place', () => {
  let s = withTasks('A', 'B', 'C', 'D'); // stored newest first: t4, t3, t2, t1
  assert.deepEqual(s.tasks.map((t) => t.id), ['t4', 't3', 't2', 't1']);
  // Drag within a filtered list that only shows t4, t2 and t1.
  s = reducer(s, { type: 'TASK_REORDER', ids: ['t1', 't4', 't2'] });
  assert.deepEqual(s.tasks.map((t) => t.id), ['t1', 't3', 't4', 't2']);
  // Unknown ids are ignored.
  s = reducer(s, { type: 'TASK_REORDER', ids: ['nope', 't2', 't1'] });
  assert.deepEqual(s.tasks.map((t) => t.id), ['t2', 't3', 't4', 't1']);
});

test('subtasks can be reordered and their name and estimate edited', () => {
  let s = { ...initialState(T0), tasks: [] };
  s = reducer(s, {
    type: 'TASK_CREATE', id: 't1', title: 'A', now: T0,
    subtasks: [{ title: 'One', estimate: 10 }, { title: 'Two', estimate: 20 }, { title: 'Three', estimate: 30 }],
  });
  const [a, b, c] = byId(s, 't1').subtasks.map((st) => st.id);
  s = reducer(s, { type: 'SUBTASK_REORDER', taskId: 't1', ids: [c, a, b] });
  assert.deepEqual(byId(s, 't1').subtasks.map((st) => st.title), ['Three', 'One', 'Two']);

  s = reducer(s, { type: 'SUBTASK_EDIT', taskId: 't1', subtaskId: a, title: ' Uno ', estimate: '45' });
  s = reducer(s, { type: 'SUBTASK_EDIT', taskId: 't1', subtaskId: b, title: '  ', estimate: -5 });
  const subs = byId(s, 't1').subtasks;
  assert.deepEqual(subs.map((st) => [st.title, st.estimate]), [['Three', 30], ['Uno', 45], ['Two', 0]]);
});

test('old saved tasks get empty Jira keys and settings get the new defaults', () => {
  const loaded = sanitizeState({ templates: [], tasks: [{ id: 'x', title: 'Old', status: 'idle', subtasks: [], logs: [] }], settings: {} });
  assert.equal(loaded.tasks[0].jiraStory, '');
  assert.equal(loaded.tasks[0].jiraParent, '');
  assert.equal(loaded.settings.runningOnTop, true);
  assert.equal(loaded.settings.jiraDomain, '');
});
