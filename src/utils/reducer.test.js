import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, sanitizeState } from './reducer.js';
import { taskElapsed, sessionsForDay } from './sessions.js';
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
  assert.deepEqual(a.logs, [{ startTime: T0, endTime: T0 + 25 * MIN, duration: 25 * MIN }]);
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
