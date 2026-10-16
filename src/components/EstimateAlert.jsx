import { useEffect } from 'react';
import { BellRing, CheckCircle2, SkipForward, Undo2, X } from 'lucide-react';
import { Button } from './ui.jsx';

/**
 * Shown when the running subtask nears / reaches its estimate. "Stay" is the
 * default (just dismisses). After an automatic move to the next subtask it
 * offers Undo instead.
 */
export function EstimateAlert({ alert, actions, onDismiss }) {
  useEffect(() => {
    if (alert?.type !== 'moved') return;
    const id = setTimeout(onDismiss, 15_000);
    return () => clearTimeout(id);
  }, [alert, onDismiss]);

  if (!alert) return null;
  const run = (fn) => () => {
    fn();
    onDismiss();
  };
  const reached = alert.type !== 'warn';

  return (
    <div className="fixed inset-x-4 top-32 z-40 flex justify-center sm:inset-x-auto sm:right-6" role="alert">
      <div
        className={`w-full max-w-md rounded-xl border bg-white p-3 shadow-xl dark:bg-slate-900 ${
          reached ? 'border-amber-300 dark:border-amber-700' : 'border-sky-300 dark:border-sky-800'
        }`}
      >
        <div className="flex items-start gap-3">
          <BellRing className={`mt-0.5 h-5 w-5 shrink-0 ${reached ? 'text-amber-500' : 'text-sky-500'}`} aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm">
            <span className="block truncate font-semibold">{alert.label}</span>
            <span className="text-slate-600 dark:text-slate-300">{alert.body}</span>
          </p>
          <Button size="icon" variant="ghost" icon={X} onClick={onDismiss} aria-label="Dismiss" title="Dismiss" />
        </div>
        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {alert.type === 'moved' ? (
            <>
              <Button size="sm" icon={Undo2} onClick={run(() => actions.start(alert.taskId, alert.fromId))}>
                Undo, go back
              </Button>
              <Button size="sm" variant="primary" onClick={onDismiss}>
                OK
              </Button>
            </>
          ) : (
            <>
              {alert.isSubtask && alert.next && (
                <Button size="sm" icon={SkipForward} onClick={run(() => actions.start(alert.taskId, alert.next.id))} title={`Move the timer to “${alert.next.title}”`}>
                  Next subtask
                </Button>
              )}
              {alert.isSubtask ? (
                <Button size="sm" icon={CheckCircle2} onClick={run(() => actions.toggleSubtask(alert.taskId, alert.subtaskId))} title="Check it off and move to the next open subtask">
                  Done{alert.next ? ' & next' : ''}
                </Button>
              ) : (
                <Button size="sm" icon={CheckCircle2} onClick={run(() => actions.complete(alert.taskId))}>
                  Mark task done
                </Button>
              )}
              <Button size="sm" variant="primary" onClick={onDismiss}>
                Stay on it
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
