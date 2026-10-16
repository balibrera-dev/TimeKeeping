import { subtaskTotals, taskElapsed, taskEstimate } from './sessions.js';

/**
 * What the running timer is measured against right now: the current subtask
 * (if it has an estimate), otherwise the whole task when it is not on any
 * subtask. Returns null when there is nothing to warn about.
 * @param {import('../types').Task} task
 */
export function estimateTarget(task, now) {
  if (!task || task.status !== 'active' || task.kind === 'interruption') return null;
  const current = task.subtasks.find((s) => s.id === task.currentSubtaskId);
  if (current) {
    if (current.done || !(current.estimate > 0)) return null;
    const idx = task.subtasks.indexOf(current);
    const next = [...task.subtasks.slice(idx + 1), ...task.subtasks.slice(0, idx)].find((s) => !s.done);
    return {
      key: `${task.id}:${current.id}`,
      label: current.title,
      isSubtask: true,
      spent: subtaskTotals(task, now).get(current.id) ?? 0,
      estimate: current.estimate * 60_000,
      next: next ?? null,
    };
  }
  const estimate = taskEstimate(task) * 60_000;
  if (!(estimate > 0)) return null;
  return { key: `${task.id}:task`, label: task.title, isSubtask: false, spent: taskElapsed(task, now), estimate, next: null };
}

/**
 * Which alert stage a target is in: 'none', 'warn' (within the lead time) or
 * 'reached' (estimate used up).
 */
export function alertStage(target, leadMs) {
  if (!target) return 'none';
  if (target.spent >= target.estimate) return 'reached';
  if (leadMs > 0 && target.spent >= target.estimate - leadMs) return 'warn';
  return 'none';
}
