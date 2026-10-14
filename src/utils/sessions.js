import { DAY, startOfDay } from './time.js';

/**
 * Every session of a task, including the open one (ended at `now`).
 * @param {import('../types').Task} task
 * @param {number} now
 */
export function taskSessions(task, now) {
  const sessions = task.logs.map((l) => ({ ...l, live: false }));
  if (task.activeStart != null) {
    sessions.push({ startTime: task.activeStart, endTime: now, duration: now - task.activeStart, live: true });
  }
  return sessions;
}

/** Total tracked milliseconds for a task, live session included. */
export function taskElapsed(task, now) {
  let total = 0;
  for (const l of task.logs) total += l.duration;
  if (task.activeStart != null) total += Math.max(0, now - task.activeStart);
  return total;
}

/** Sum of subtask estimates, in minutes. */
export function taskEstimate(task) {
  return task.subtasks.reduce((sum, s) => sum + (Number(s.estimate) || 0), 0);
}

/**
 * Sessions of all tasks clipped to [rangeStart, rangeEnd). A session that
 * crosses midnight is split so each day only shows its own part.
 * @param {import('../types').Task[]} tasks
 */
export function sessionsInRange(tasks, rangeStart, rangeEnd, now) {
  const out = [];
  for (const task of tasks) {
    for (const s of taskSessions(task, now)) {
      const start = Math.max(s.startTime, rangeStart);
      const end = Math.min(s.endTime, rangeEnd);
      if (end > start) {
        out.push({ task, startTime: start, endTime: end, duration: end - start, live: s.live });
      }
    }
  }
  return out.sort((a, b) => a.startTime - b.startTime);
}

export function sessionsForDay(tasks, dayTs, now) {
  const start = startOfDay(dayTs);
  return sessionsInRange(tasks, start, start + DAY, now);
}

/** Per-task totals for a list of clipped sessions, biggest first. */
export function breakdown(sessions) {
  const byTask = new Map();
  for (const s of sessions) {
    const row = byTask.get(s.task.id) ?? { task: s.task, duration: 0, sessions: 0 };
    row.duration += s.duration;
    row.sessions += 1;
    byTask.set(s.task.id, row);
  }
  return [...byTask.values()].sort((a, b) => b.duration - a.duration);
}
