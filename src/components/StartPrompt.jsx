import { useEffect } from 'react';
import { ArrowRightLeft, CheckCircle2, Play, X } from 'lucide-react';
import { Button } from './ui.jsx';

/**
 * Shown after a task is created without starting it: offers to start it now
 * (switching away from the running task). Disappears after a few seconds.
 */
export function StartPrompt({ created, hasActive, onStart, onDismiss }) {
  useEffect(() => {
    if (!created) return;
    const id = setTimeout(onDismiss, 10_000);
    return () => clearTimeout(id);
  }, [created, onDismiss]);

  if (!created) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-auto sm:right-6" role="status">
      <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-medium">“{created.title}” created</span>
          <span className="text-slate-500 dark:text-slate-400">{hasActive ? 'Switch to it now?' : 'Start the timer now?'}</span>
        </p>
        <Button
          size="sm"
          variant="primary"
          icon={hasActive ? ArrowRightLeft : Play}
          onClick={() => {
            onStart(created.id);
            onDismiss();
          }}
        >
          {hasActive ? 'Switch' : 'Start'}
        </Button>
        <Button size="icon" variant="ghost" icon={X} onClick={onDismiss} aria-label="Not now" title="Not now" />
      </div>
    </div>
  );
}
