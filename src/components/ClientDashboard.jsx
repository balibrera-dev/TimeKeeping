import { useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, CalendarDays, ClipboardList, ListChecks } from 'lucide-react';
import { Button, Card, EmptyState } from './ui.jsx';
import { TasksView } from './TasksView.jsx';
import { SubtasksView } from './SubtasksView.jsx';
import { CalendarView } from './CalendarView.jsx';
import { formatDuration, addDays, startOfDay, startOfWeek } from '../utils/time.js';
import { sessionsInRange, taskElapsed, workSessions } from '../utils/sessions.js';

const SECTIONS = [
  { id: 'client-tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'client-subtasks', label: 'Subtasks', icon: ListChecks },
  { id: 'client-calendar', label: 'Calendar', icon: CalendarDays },
];

const sum = (sessions) => sessions.reduce((n, s) => n + s.duration, 0);

/** One client's tasks, subtasks and calendar on a single page, at /<client-slug>. */
export function ClientDashboard({ client, state, activeTask, actions, now, onBack, onCreated, onManageTemplates, onManageClients, onOpenSettings }) {
  const [focusTaskId, setFocusTaskId] = useState(null);
  const tasks = useMemo(() => state.tasks.filter((t) => t.clientId === client?.id), [state.tasks, client?.id]);

  const stats = useMemo(() => {
    const day = startOfDay(now);
    const week = startOfWeek(now);
    const today = sum(workSessions(sessionsInRange(tasks, day, addDays(day, 1), now)));
    const thisWeek = sum(workSessions(sessionsInRange(tasks, week, addDays(week, 7), now)));
    const total = tasks.reduce((n, t) => n + taskElapsed(t, now), 0);
    const open = tasks.filter((t) => t.status !== 'completed').length;
    const subtasks = tasks.flatMap((t) => t.subtasks.map((s) => s.done || t.status === 'completed'));
    return { today, thisWeek, total, open, done: subtasks.filter(Boolean).length, subtasks: subtasks.length };
  }, [tasks, now]);

  if (!client) {
    return (
      <EmptyState
        icon={Briefcase}
        title="Client not found"
        action={
          <Button variant="primary" icon={ArrowLeft} onClick={onBack}>
            Go to Clients
          </Button>
        }
      >
        This link doesn’t match any client in this browser. The client may have been renamed or deleted.
      </EmptyState>
    );
  }

  const running = activeTask?.clientId === client.id ? activeTask : null;
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openTask = (id) => {
    setFocusTaskId(id);
    jump('client-tasks');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All clients
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <span className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundColor: client.color }} aria-hidden="true" />
          <div className="mr-auto min-w-0">
            <h1 className="truncate text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {running ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Tracking “{running.title}” now</span>
              ) : (
                'Client dashboard: only this client’s work shows here.'
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Today', formatDuration(stats.today)],
            ['This week', formatDuration(stats.thisWeek)],
            ['Total', formatDuration(stats.total)],
            ['Open tasks', `${stats.open}`, stats.subtasks ? `${stats.done}/${stats.subtasks} subtasks done` : null],
          ].map(([label, value, hint]) => (
            <Card key={label} className="border-t-4 p-3" style={{ borderTopColor: client.color }}>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p className="tabular text-xl font-semibold">{value}</p>
              {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </Card>
          ))}
        </div>
      </div>

      <nav aria-label="Dashboard sections" className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => jump(id)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </nav>

      <section id="client-tasks" className="scroll-mt-40">
        <TasksView
          state={state}
          activeTask={activeTask}
          actions={actions}
          now={now}
          clientId={client.id}
          onCreated={onCreated}
          onManageTemplates={onManageTemplates}
          onManageClients={onManageClients}
          onOpenSettings={onOpenSettings}
          focusTaskId={focusTaskId}
          onFocused={() => setFocusTaskId(null)}
        />
      </section>

      <section id="client-subtasks" className="scroll-mt-40 border-t border-slate-200 pt-6 dark:border-slate-800">
        <SubtasksView
          state={state}
          actions={actions}
          now={now}
          clientId={client.id}
          onOpenTasks={() => jump('client-tasks')}
          onOpenTask={openTask}
          onOpenSettings={onOpenSettings}
        />
      </section>

      <section id="client-calendar" className="scroll-mt-40 space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        <h2 className="text-xl font-semibold">Calendar</h2>
        <CalendarView tasks={tasks} clients={state.clients} now={now} embedded />
      </section>
    </div>
  );
}
