import { ArrowRight, BellRing, Pause, Play, Undo2, X } from 'lucide-react';
import { Button } from './ui.jsx';
import { formatClock, formatDuration } from '../utils/time.js';

/** Prompt shown when the running subtask (or task) is about to reach its estimate. */
export function EstimateAlert({ alert, remaining, onStay, onNext, onPause, onGoBack, onDismiss }) {
  if (!alert) return null;

  if (alert.advanced) {
    return (
      <Shell tone="emerald">
        <ArrowRight className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-medium">“{alert.title}” reached its estimate</span>
          <span className="block truncate text-slate-500 dark:text-slate-400">
            Checked off{alert.nextTitle ? `, timer moved to “${alert.nextTitle}”` : ''}.
          </span>
        </p>
        <Button size="sm" icon={Undo2} onClick={onGoBack}>
          Go back
        </Button>
        <Button size="icon" variant="ghost" icon={X} onClick={onDismiss} aria-label="Dismiss" title="Dismiss" />
      </Shell>
    );
  }

  const left = remaining == null ? '' : remaining > 0 ? `${formatClock(remaining)} left of ${formatDuration(alert.estimate)}` : `Over the ${formatDuration(alert.estimate)} estimate`;
  return (
    <Shell tone="amber">
      <BellRing className="h-5 w-5 shrink-0 animate-pulse text-amber-500" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <span className="block truncate font-medium">{alert.title}</span>
        <span className="block truncate text-slate-500 dark:text-slate-400">
          {alert.subtaskId ? `${alert.taskTitle} · ` : ''}
          {left}
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="primary" icon={Play} onClick={onStay}>
            Stay on it
          </Button>
          {alert.subtaskId && (
            <Button size="sm" icon={ArrowRight} onClick={onNext}>
              {alert.hasNext ? 'Next subtask' : 'Check it off'}
            </Button>
          )}
          <Button size="sm" icon={Pause} onClick={onPause}>
            Pause
          </Button>
        </div>
      </div>
      <Button size="icon" variant="ghost" icon={X} onClick={onStay} aria-label="Dismiss (stay on it)" title="Dismiss (stay on it)" className="self-start" />
    </Shell>
  );
}

function Shell({ tone, children }) {
  const ring = tone === 'amber' ? 'border-amber-300 dark:border-amber-500/50' : 'border-slate-200 dark:border-slate-700';
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6" role="alert">
      <div className={`flex w-full max-w-md items-center gap-3 rounded-xl border bg-white p-3 shadow-xl dark:bg-slate-900 ${ring}`}>{children}</div>
    </div>
  );
}
