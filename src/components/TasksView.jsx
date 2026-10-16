import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { Button, ClientSelect, EmptyState, inputClass } from './ui.jsx';
import { TaskCard } from './TaskCard.jsx';
import { NewTaskModal } from './NewTaskModal.jsx';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'interruptions', label: 'Calls & breaks' },
  { id: 'all', label: 'All' },
];

const isWork = (t) => t.kind !== 'interruption';
const MATCHERS = {
  open: (t) => isWork(t) && t.status !== 'completed',
  completed: (t) => isWork(t) && t.status === 'completed',
  interruptions: (t) => !isWork(t),
  all: () => true,
};

const ORDER = { active: 0, paused: 1, idle: 2, completed: 3 };

export function TasksView({ state, activeTask, actions, now, onManageTemplates, onManageClients, onCreated }) {
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState(null);
  const [creating, setCreating] = useState(false);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, state.tasks.filter(MATCHERS[f.id]).length])),
    [state.tasks],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const clientName = (t) => state.clients.find((c) => c.id === t.clientId)?.name.toLowerCase() ?? '';
    const matches = (t) =>
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      clientName(t).includes(q) ||
      t.notes.toLowerCase().includes(q) ||
      t.subtasks.some((s) => s.title.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q));
    return state.tasks
      .filter(MATCHERS[filter])
      .filter((t) => !clientFilter || t.clientId === clientFilter)
      .filter(matches)
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt - a.createdAt);
  }, [state.tasks, state.clients, filter, query, clientFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Tasks</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} w-56 pl-8`} placeholder="Search tasks & comments" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {state.clients.length > 0 && (
          <div className="w-44">
            <ClientSelect clients={state.clients} value={clientFilter} onChange={setClientFilter} />
          </div>
        )}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                filter === f.id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {f.label} <span className="text-slate-400">{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
          New task
        </Button>
      </div>

      {state.tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tasks yet"
          action={
            <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
              Create your first task
            </Button>
          }
        >
          Create a task from a template (like “New Development”) to get its checklist and estimates, or an ad-hoc task. Tip: press S anywhere to
          switch tasks, and use Call / Break / Lunch in the top bar when you get pulled away.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="Nothing matches">
          {query || clientFilter
            ? 'Try a different search or client.'
            : filter === 'completed'
              ? 'No completed tasks yet.'
              : filter === 'interruptions'
                ? 'No calls or breaks tracked yet. Use the Call / Break / Lunch buttons in the top bar.'
                : 'All tasks are completed. Nice work.'}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} now={now} actions={actions} hasActive={!!activeTask} clients={state.clients} settings={state.settings} onManageClients={onManageClients} />
          ))}
        </div>
      )}

      <NewTaskModal
        open={creating}
        onClose={() => setCreating(false)}
        templates={state.templates}
        clients={state.clients}
        onCreate={(input) => {
          const id = actions.createTask(input);
          if (!input.startNow) onCreated(id, input.title.trim());
        }}
        onManageClients={() => {
          setCreating(false);
          onManageClients();
        }}
        onManageTemplates={() => {
          setCreating(false);
          onManageTemplates();
        }}
      />
    </div>
  );
}
