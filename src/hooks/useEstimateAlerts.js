import { useCallback, useEffect, useRef, useState } from 'react';
import { alertStage, estimateTarget } from '../utils/estimates.js';
import { playPing, showNotification } from '../utils/alerts.js';
import { formatMinutes } from '../utils/time.js';

const RANK = { none: 0, warn: 1, reached: 2 };

/**
 * Watches the running timer against its estimate. When the current subtask
 * (or a task without subtasks) gets close to / reaches its estimate it pings,
 * optionally shows a system notification, and either asks what to do (stay is
 * the default) or moves to the next subtask automatically, per settings.
 *
 * Each subtask alerts once per stage; resuming something already over its
 * estimate doesn't re-alert.
 */
export function useEstimateAlerts({ activeTask, now, settings, actions }) {
  const [alert, setAlert] = useState(null);
  const seen = useRef(new Map()); // target key -> highest stage already handled
  const enabled = settings.estimateAlerts;
  const leadMs = Math.max(0, Number(settings.alertLeadMinutes) || 0) * 60_000;

  const target = enabled ? estimateTarget(activeTask, now) : null;
  const stage = alertStage(target, leadMs);

  useEffect(() => {
    if (!target) return;
    const prev = seen.current.get(target.key);
    if (prev === undefined || RANK[stage] < RANK[prev]) {
      // First time we see this target, or its time went down (reset / edit): just record.
      seen.current.set(target.key, stage);
      return;
    }
    if (RANK[stage] <= RANK[prev]) return;
    seen.current.set(target.key, stage);

    const task = activeTask;
    const est = formatMinutes(target.estimate / 60_000);
    const autoNext = stage === 'reached' && settings.onEstimateReached === 'next' && target.next;
    const left = Math.max(1, Math.round((target.estimate - target.spent) / 60_000));
    const body = autoNext
      ? `Estimate (${est}) reached. Moved on to “${target.next.title}”.`
      : stage === 'warn'
        ? `${left} min left of the ${est} estimate.`
        : `Estimate (${est}) reached. Stay on it, or move on?`;

    if (autoNext) {
      actions.start(task.id, target.next.id);
      setAlert({ type: 'moved', taskId: task.id, fromId: task.currentSubtaskId, label: target.label, nextLabel: target.next.title, body });
    } else {
      setAlert({ type: stage, taskId: task.id, key: target.key, label: target.label, taskTitle: task.title, isSubtask: target.isSubtask, next: target.next, subtaskId: task.currentSubtaskId, body });
    }
    if (settings.alertSound) playPing();
    if (settings.desktopNotifications && (document.visibilityState !== 'visible' || !document.hasFocus())) {
      showNotification(target.label, body, target.key);
    }
  }, [target?.key, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // A question about a subtask the timer is no longer on is moot.
  useEffect(() => {
    if (alert && alert.type !== 'moved' && alert.key !== target?.key) setAlert(null);
  }, [alert, target?.key]);

  const dismiss = useCallback(() => setAlert(null), []);
  return { alert, dismiss };
}
