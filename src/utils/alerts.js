import { taskElapsed, taskEstimate, trackedSubtaskTotals } from './sessions.js';

/**
 * What the running timer is measured against: the current subtask's estimate,
 * or the whole task's estimate when no subtask is selected. Null when there is
 * nothing to compare (no active work task, no estimate, subtask already done).
 * @param {import('../types').Task | null} task
 * @param {number} now
 */
export function estimateTarget(task, now) {
  if (!task || task.kind === 'interruption' || task.status !== 'active') return null;
  const base = { taskId: task.id, taskTitle: task.title };
  const st = task.subtasks.find((s) => s.id === task.currentSubtaskId);
  if (st) {
    const estimate = (Number(st.estimate) || 0) * 60_000;
    if (!estimate || st.done) return null;
    const elapsed = trackedSubtaskTotals(task, now).get(st.id) ?? 0;
    const hasNext = task.subtasks.some((s) => !s.done && s.id !== st.id);
    return { ...base, key: `${task.id}:${st.id}`, subtaskId: st.id, title: st.title, elapsed, estimate, remaining: estimate - elapsed, hasNext };
  }
  const estimate = taskEstimate(task) * 60_000;
  if (!estimate) return null;
  const elapsed = taskElapsed(task, now);
  return { ...base, key: `${task.id}:task`, subtaskId: null, title: task.title, elapsed, estimate, remaining: estimate - elapsed, hasNext: false };
}

/** How long before the estimate the heads-up fires; never more than half the estimate. */
export function alertLeadMs(settings, estimate) {
  const lead = Math.max(0, Number(settings?.alertLeadMinutes) || 0) * 60_000;
  return Math.min(lead, estimate / 2);
}
