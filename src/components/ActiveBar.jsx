import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Moon, Pause, Play, Sun, Timer } from 'lucide-react';
import { Button, ProgressBar } from './ui.jsx';
import { SwitchMenu } from './SwitchMenu.jsx';
import { formatClock, formatDuration, formatMinutes } from '../utils/time.js';
import { sessionsForDay, taskElapsed, taskEstimate } from '../utils/sessions.js';

const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'templates', label: 'Templates' },
];

/** Always-visible header: navigation, today's total, and the active-task strip. */
export function ActiveBar({ state, activeTask, actions, now, view, setView, theme, toggleTheme }) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const todayTotal = sessionsForDay(state.tasks, now, now).reduce((sum, s) => sum + s.duration, 0);
  const lastPaused = state.tasks
    .filter((t) => t.status === 'paused' && t.logs.length)
    .sort((a, b) => b.logs[b.logs.length - 1].endTime - a.logs[a.logs.length - 1].endTime)[0];

  // "S" opens the switcher; Space pauses / resumes. Ignored while typing.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSwitchOpen(true);
      } else if (e.key === ' ' && tag !== 'BUTTON' && !document.querySelector('[role="dialog"]')) {
        e.preventDefault();
        if (activeTask) actions.pause(activeTask.id);
        else if (lastPaused) actions.start(lastPaused.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTask, lastPaused, actions]);

  const quickCreate = (title) => actions.createTask({ title, category: 'Other', subtasks: [], startNow: true });

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-emerald-500">
            <Timer className="h-4.5 w-4.5 text-emerald-400 dark:text-slate-950" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-wide">BALISOFT</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">TimeKeeping</div>
          </div>
        </div>

        <nav className="ml-2 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                view === t.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-sm text-slate-600 sm:flex dark:text-slate-400" title="Total tracked today">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Today <span className="tabular font-mono font-semibold text-slate-900 dark:text-slate-100">{formatDuration(todayTotal)}</span>
          </div>
          <Button variant="ghost" size="icon" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme} aria-label="Toggle theme" />
        </div>
      </div>

      <div
        className={`border-t transition-colors ${
          activeTask
            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/40'
            : 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50'
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          {activeTask ? (
            <ActiveSummary task={activeTask} now={now} />
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              {lastPaused ? (
                <>
                  No timer running. Last: <span className="truncate font-medium text-slate-700 dark:text-slate-200">{lastPaused.title}</span>
                </>
              ) : (
                'No timer running. Start a task or press S to switch.'
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {activeTask ? (
              <>
                <Button variant="amber" icon={Pause} onClick={() => actions.pause(activeTask.id)} title="Pause (Space)">
                  Pause
                </Button>
                <Button variant="secondary" icon={CheckCircle2} onClick={() => actions.complete(activeTask.id)}>
                  Done
                </Button>
              </>
            ) : (
              lastPaused && (
                <Button variant="primary" icon={Play} onClick={() => actions.start(lastPaused.id)} title="Resume (Space)">
                  Resume
                </Button>
              )
            )}
            <SwitchMenu
              tasks={state.tasks}
              activeTask={activeTask}
              now={now}
              onSwitch={actions.start}
              onQuickCreate={quickCreate}
              open={switchOpen}
              setOpen={setSwitchOpen}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function ActiveSummary({ task, now }) {
  const elapsed = taskElapsed(task, now);
  const session = now - task.activeStart;
  const estimate = taskEstimate(task);
  const done = task.subtasks.filter((s) => s.done).length;
  const next = task.subtasks.find((s) => !s.done);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{task.title}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">
          {task.category}
          {task.subtasks.length > 0 && ` · ${done}/${task.subtasks.length} subtasks`}
          {next && ` · Next: ${next.title}`}
        </div>
      </div>
      <div className="ml-auto text-right">
        <div className="tabular font-mono text-xl font-semibold text-emerald-700 dark:text-emerald-400">{formatClock(elapsed)}</div>
        <div className="tabular text-[11px] text-slate-500 dark:text-slate-400">
          session {formatClock(session)}
          {estimate > 0 && ` · est ${formatMinutes(estimate)}`}
        </div>
      </div>
      {estimate > 0 && (
        <div className="hidden w-28 md:block">
          <ProgressBar value={elapsed} max={estimate * 60_000} />
        </div>
      )}
    </div>
  );
}
