import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer } from './reducer.js';
import { alertStage, estimateTarget } from './estimates.js';
import { sessionsForDay, workSessions } from './sessions.js';
import { dayLogRows } from './export.js';

const T0 = new Date(2026, 9, 16, 9, 0, 0).getTime();
const MIN = 60_000;

function running() {
  let s = { ...initialState(T0), tasks: [] };
  s = reducer(s, {
    type: 'TASK_CREATE',
    id: 'r',
    title: 'Report',
    subtasks: [
      { title: 'Get data', estimate: 30 },
      { title: 'Build visual', estimate: 45 },
    ],
    now: T0,
  });
  return reducer(s, { type: 'TASK_START', id: 'r', now: T0 });
}

test('estimate target is the running subtask, with the next open one', () => {
  const s = running();
  const task = s.tasks[0];
  const target = estimateTarget(task, T0 + 10 * MIN);
  assert.equal(target.label, 'Get data');
  assert.equal(target.estimate, 30 * MIN);
  assert.equal(target.spent, 10 * MIN);
  assert.equal(target.next.title, 'Build visual');
});

test('alert stages: none, warn within the lead time, reached', () => {
  const task = running().tasks[0];
  const lead = 1 * MIN;
  assert.equal(alertStage(estimateTarget(task, T0 + 20 * MIN), lead), 'none');
  assert.equal(alertStage(estimateTarget(task, T0 + 29.5 * MIN), lead), 'warn');
  assert.equal(alertStage(estimateTarget(task, T0 + 30 * MIN), lead), 'reached');
  assert.equal(alertStage(estimateTarget(task, T0 + 29.5 * MIN), 0), 'none');
});

test('no estimate target for paused tasks or interruptions', () => {
  let s = running();
  s = reducer(s, { type: 'INTERRUPT_START', id: 'c', interruptType: 'call', now: T0 + MIN });
  assert.equal(estimateTarget(s.tasks.find((t) => t.id === 'r'), T0 + 2 * MIN), null);
  assert.equal(estimateTarget(s.tasks.find((t) => t.id === 'c'), T0 + 2 * MIN), null);
});

test('idle time is recorded but excluded from work totals and exports', () => {
  let s = running();
  s = reducer(s, { type: 'INTERRUPT_START', id: 'i', interruptType: 'idle', now: T0 + 20 * MIN });
  s = reducer(s, { type: 'INTERRUPT_END', id: 'i', resume: true, now: T0 + 50 * MIN });
  const now = T0 + 60 * MIN;
  const all = sessionsForDay(s.tasks, T0, now);
  assert.equal(all.reduce((sum, x) => sum + x.duration, 0), 60 * MIN, 'all sessions incl. idle');
  assert.equal(workSessions(all).reduce((sum, x) => sum + x.duration, 0), 30 * MIN, 'work only');
  assert.ok(dayLogRows(s.tasks, T0, now).every((r) => r.type !== 'idle'));
  assert.equal(s.tasks.find((t) => t.id === 'r').status, 'active', 'resumes the task after idle');
});
