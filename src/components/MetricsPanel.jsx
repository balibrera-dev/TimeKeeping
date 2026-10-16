import { BarChart3, Briefcase, Clock, ListChecks, Moon, Target } from 'lucide-react';
import { Card, ProgressBar, StatusBadge, taskColor } from './ui.jsx';
import { formatClock, formatDuration, formatMinutes } from '../utils/time.js';
import { breakdown, clientBreakdown, countsTowardTotal, taskElapsed, taskEstimate } from '../utils/sessions.js';

/** Summary metrics for the sessions in the visible range. */
export function MetricsPanel({ sessions: all, now, label, clients }) {
  // Idle time is left out of every total; it gets its own line instead.
  const sessions = all.filter((s) => countsTowardTotal(s.task));
  const idle = all.reduce((sum, s) => sum + (countsTowardTotal(s.task) ? 0 : s.duration), 0);
  const total = sessions.reduce((sum, s) => sum + s.duration, 0);
  const rows = breakdown(sessions);
  const estimated = rows.filter((r) => r.task.kind !== 'interruption' && taskEstimate(r.task) > 0);
  const byClient = clientBreakdown(sessions);
  const showClients = clients.length > 0 && byClient.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Clock} label="Tracked" value={formatDuration(total)} accent />
        <Stat icon={BarChart3} label="Sessions" value={sessions.length} />
        <Stat icon={ListChecks} label="Tasks" value={rows.length} />
      </div>
      {idle > 0 && (
        <p className="-mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Moon className="h-3.5 w-3.5" aria-hidden="true" /> {formatDuration(idle)} idle {label}, not counted in Tracked.
        </p>
      )}

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Breakdown</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No time logged {label}. Start a timer and it will show up here.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map(({ task, duration }) => (
              <li key={task.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: taskColor(task, clients) }} />
                    <span className="truncate">{task.title}</span>
                  </span>
                  <span className="tabular shrink-0 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {formatDuration(duration)} · {total ? Math.round((duration / total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full" style={{ backgroundColor: taskColor(task, clients), width: `${total ? (duration / total) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showClients && (
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Briefcase className="h-4 w-4 text-slate-400" /> By client
          </h3>
          <ul className="space-y-2">
            {byClient.map(({ clientId, duration }) => {
              const client = clients.find((c) => c.id === clientId);
              return (
                <li key={clientId ?? 'none'} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: client?.color ?? '#cbd5e1' }} />
                    <span className={`truncate ${client ? '' : 'text-slate-500 dark:text-slate-400'}`}>{client?.name ?? 'No client'}</span>
                  </span>
                  <span className="tabular shrink-0 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {formatDuration(duration)} · {total ? Math.round((duration / total) * 100) : 0}%
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Target className="h-4 w-4 text-slate-400" /> Progress vs. estimates
        </h3>
        {estimated.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Tasks with subtask estimates you worked on {label} appear here.</p>
        ) : (
          <ul className="space-y-3">
            {estimated.map(({ task }) => {
              const elapsed = taskElapsed(task, now);
              const est = taskEstimate(task);
              const done = task.subtasks.filter((s) => s.done).length;
              const doneEst = task.subtasks.filter((s) => s.done).reduce((sum, s) => sum + (Number(s.estimate) || 0), 0);
              const over = elapsed > est * 60_000;
              return (
                <li key={task.id} className="text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{task.title}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <ProgressBar value={elapsed} max={est * 60_000} />
                  <div className="mt-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className={over ? 'font-medium text-amber-600 dark:text-amber-400' : ''}>
                      {formatClock(elapsed)} of {formatMinutes(est)}
                      {over && ' (over)'}
                    </span>
                    <span>
                      {done}/{task.subtasks.length} done · {est ? Math.round((doneEst / est) * 100) : 0}% of scope
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </div>
      <div className={`tabular mt-1 whitespace-nowrap font-mono text-lg font-semibold ${accent ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{value}</div>
    </Card>
  );
}
