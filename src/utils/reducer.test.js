import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, sanitizeState } from './reducer.js';
import { taskElapsed, sessionsForDay, subtaskTotals } from './sessions.js';
import { toCSV, dayLogRows } from './export.js';

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
