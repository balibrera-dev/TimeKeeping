import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, CornerDownRight, Moon, Pause, Play, Settings, Square, Sun, Timer, Undo2 } from 'lucide-react';
import { Button, ClientBadge, ProgressBar } from './ui.jsx';
import { SwitchMenu } from './SwitchMenu.jsx';
import { InterruptMenu } from './InterruptMenu.jsx';
import { INTERRUPTIONS } from '../types/index.js';
import { formatClock, formatDuration, formatMinutes } from '../utils/time.js';
import { sessionsForDay, subtaskTotals, taskElapsed, taskEstimate, workSessions } from '../utils/sessions.js';

const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'clients', label: 'Clients' },
  { id: 'templates', label: 'Templates' },
];

/** Always-visible header: navigation, today's total, and the active-task strip. */
export function ActiveBar({ state, activeTask, actions, now, view, setView, theme, toggleTheme, onCreated, onOpenSettings }) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const todayTotal = workSessions(sessionsForDay(state.tasks, now, now)).reduce((sum, s) => sum + s.duration, 0);
  const lastPaused = state.tasks
    .filter((t) => t.status === 'paused' && t.kind !== 'interruption' && t.logs.length)
    .sort((a, b) => b.logs[b.logs.length - 1].endTime - a.logs[a.logs.length - 1].endTime)[0];
  const isInterruption = activeTask?.kind === 'interruption';
  const resumeTask = isInterruption ? state.tasks.find((t) => t.id === activeTask.resumeTaskId && t.status !== 'completed') : null;

  // "S" opens the switcher; Space pauses / resumes (or ends a call and resumes). Ignored while typing.
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
        if (activeTask?.kind === 'interruption') actions.endInterruption(activeTask.id, true);
        else if (activeTask) actions.pause(activeTask.id);
        else if (lastPaused) actions.start(lastPaused.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTask, lastPaused, actions]);

  const quickCreate = (title, startNow) => {
    const id = actions.createTask({ title, category: 'Other', subtasks: [], startNow });
    if (!startNow) onCreated(id, title);
  };

  const stripTone = isInterruption
    ? 'border-violet-200 bg-violet-50/80 dark:border-violet-900/60 dark:bg-violet-950/40'
    : activeTask
      ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/40'
      : 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-emerald-500">
            <Timer className="h-4.5 w-4.5 text-emerald-400 dark:text-slate-950" aria-hidden="true" />
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-bold tracking-wide">BALISOFT</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">TimeKeeping</div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 sm:ml-2 dark:bg-slate-900">
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

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-sm text-slate-600 md:flex dark:text-slate-400" title="Total tracked today">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Today <span className="tabular font-mono font-semibold text-slate-900 dark:text-slate-100">{formatDuration(todayTotal)}</span>
          </div>
          <Button variant="ghost" size="icon" icon={Settings} onClick={onOpenSettings} aria-label="Settings" title="Settings" />
          <Button variant="ghost" size="icon" icon={theme === 'dark' ? Sun : Moon} onClick={toggleTheme} aria-label="Toggle theme" />
        </div>
      </div>

      <div className={`border-t transition-colors ${stripTone}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          {activeTask ? (
            <ActiveSummary task={activeTask} clients={state.clients} now={now} resumeTask={resumeTask} />
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

          <div className="flex flex-wrap items-center gap-2">
            {isInterruption ? (
              <>
                {resumeTask && (
                  <Button variant="primary" icon={Undo2} onClick={() => actions.endInterruption(activeTask.id, true)} title={`End and resume “${resumeTask.title}” (Space)`}>
                    <span className="max-w-[10rem] truncate">Back to {resumeTask.title}</span>
                  </Button>
                )}
                <Button variant={resumeTask ? 'secondary' : 'amber'} icon={Square} onClick={() => actions.endInterruption(activeTask.id, false)} title="End without resuming anything">
                  End
                </Button>
              </>
            ) : activeTask ? (
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
            <InterruptMenu clients={state.clients} onStart={actions.startInterruption} activeInterruptType={isInterruption ? activeTask.interruptType : null} />
            <SwitchMenu
              tasks={state.tasks}
              clients={state.clients}
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

function ActiveSummary({ task, clients, now, resumeTask }) {
  const elapsed = taskElapsed(task, now);
  const session = now - task.activeStart;
  const estimate = taskEstimate(task);
  const done = task.subtasks.filter((s) => s.done).length;
  const current = task.subtasks.find((s) => s.id === task.currentSubtaskId);
  const currentSpent = current ? (subtaskTotals(task, now).get(current.id) ?? 0) : 0;
  const client = clients.find((c) => c.id === task.clientId);
  const interruption = task.kind === 'interruption' ? INTERRUPTIONS[task.interruptType] : null;
  const dot = interruption ? 'bg-violet-500' : 'bg-emerald-500';
  const ping = interruption ? 'bg-violet-400' : 'bg-emerald-400';

  return (
    <div className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-0 sm:gap-4">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${ping}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {interruption && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: interruption.color }}>
              {interruption.label}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{task.title}</span>
          {client && (
            <span className="hidden min-w-0 sm:inline-flex">
              <ClientBadge client={client} />
            </span>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
          {interruption ? (
            resumeTask ? (
              <>Paused: {resumeTask.title}</>
            ) : (
              'Not working on a task'
            )
          ) : current ? (
            <>
              <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate font-medium text-emerald-700 dark:text-emerald-400">{current.title}</span>
              <span className="tabular hidden shrink-0 font-mono sm:inline">
                {formatClock(currentSpent)}
                {current.estimate > 0 && ` / ${formatMinutes(current.estimate)}`}
              </span>
              <span className="hidden shrink-0 sm:inline">· {done}/{task.subtasks.length} done</span>
            </>
          ) : (
            <>
              {task.category}
              {task.subtasks.length > 0 && ` · ${done}/${task.subtasks.length} subtasks · not on a subtask`}
            </>
          )}
        </div>
      </div>
      <div className="ml-auto shrink-0 text-right">
        <div className={`tabular font-mono text-lg font-semibold sm:text-xl ${interruption ? 'text-violet-700 dark:text-violet-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
          {formatClock(elapsed)}
        </div>
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
