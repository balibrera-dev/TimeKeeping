import { useCallback, useEffect, useRef, useState } from 'react';
import { alertLeadMs, estimateTarget } from '../utils/alerts.js';
import { playPing, unlockAudio } from '../utils/sound.js';
import { showNotification } from '../utils/notify.js';
import { DEFAULT_SETTINGS } from '../utils/reducer.js';

/**
 * Watches the running timer against its estimate. A few minutes before the
 * estimate it pings, shows a desktop notification (when the tab is in the
 * background and notifications are on) and opens a prompt: stay, move to the
 * next subtask, or pause. With "move to next automatically" on, reaching the
 * estimate checks the subtask off and moves the timer, unless you chose to stay.
 * Each subtask alerts once per page load.
 */
export function useEstimateAlerts({ activeTask, now, settings, actions }) {
  const opts = { ...DEFAULT_SETTINGS, ...settings };
  const target = estimateTarget(activeTask, now);
  const [alert, setAlert] = useState(null);
  const fired = useRef(new Set());
  const stayed = useRef(new Set());
  const note = useRef(null);
  const baseTitle = useRef(typeof document !== 'undefined' ? document.title : '');

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const close = useCallback(() => {
    note.current?.close();
    note.current = null;
    setAlert(null);
  }, []);

  useEffect(() => {
    // The prompt belongs to one subtask; drop it if the timer moved elsewhere.
    if (alert && !alert.advanced && alert.key !== target?.key) close();
    if (!target) return;

    if (!fired.current.has(target.key) && target.remaining <= alertLeadMs(opts, target.estimate)) {
      fired.current.add(target.key);
      if (opts.alertSound) playPing();
      const background = document.visibilityState !== 'visible' || !document.hasFocus();
      if (opts.alertNotify && background) {
        const left = target.remaining > 0 ? `${Math.max(1, Math.ceil(target.remaining / 60_000))} min left` : 'Estimate reached';
        const next = opts.onEstimate === 'next' && target.hasNext ? 'Moving to the next subtask at the estimate.' : 'Open the app to stay, move on or pause.';
        note.current = showNotification(`${left}: ${target.title}`, `${target.subtaskId ? `${target.taskTitle} · ` : ''}${next}`, target.key);
      }
      setAlert({ ...target, advanced: false });
    }

    if (opts.onEstimate === 'next' && target.subtaskId && target.hasNext && target.remaining <= 0 && !stayed.current.has(target.key)) {
      stayed.current.add(target.key);
      // Same order the reducer uses: the next open subtask after this one, wrapping around.
      const subs = activeTask.subtasks;
      const idx = subs.findIndex((s) => s.id === target.subtaskId);
      const nextTitle = [...subs.slice(idx + 1), ...subs.slice(0, idx)].find((s) => !s.done)?.title;
      actions.toggleSubtask(target.taskId, target.subtaskId);
      if (opts.alertSound) playPing();
      setAlert({ ...target, advanced: true, nextTitle });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, target?.key, opts.onEstimate, opts.alertLeadMinutes]);

  // Flag the tab title while a prompt is waiting, so it shows in the taskbar.
  useEffect(() => {
    if (alert && !alert.advanced) {
      const original = baseTitle.current;
      document.title = `⏰ ${alert.title} · ${original}`;
      return () => {
        document.title = original;
      };
    }
  }, [alert]);

  const stay = useCallback(() => {
    if (alert) stayed.current.add(alert.key);
    close();
  }, [alert, close]);

  const next = useCallback(() => {
    if (alert?.subtaskId) {
      stayed.current.add(alert.key);
      actions.toggleSubtask(alert.taskId, alert.subtaskId);
    }
    close();
  }, [alert, actions, close]);

  const pause = useCallback(() => {
    if (alert) actions.pause(alert.taskId);
    close();
  }, [alert, actions, close]);

  /** Undo an automatic move: reopen the subtask and put the timer back on it. */
  const goBack = useCallback(() => {
    if (alert?.subtaskId) {
      actions.toggleSubtask(alert.taskId, alert.subtaskId);
      actions.start(alert.taskId, alert.subtaskId);
    }
    close();
  }, [alert, actions, close]);

  return { alert, remaining: target && alert && target.key === alert.key ? target.remaining : null, stay, next, pause, goBack, dismiss: close };
}
