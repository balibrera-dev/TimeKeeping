import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { Button, EmptyState, inputClass } from './ui.jsx';
import { TaskCard } from './TaskCard.jsx';
import { NewTaskModal } from './NewTaskModal.jsx';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'completed', label: 'Completed' },
  { id: 'all', label: 'All' },
];

const ORDER = { active: 0, paused: 1, idle: 2, completed: 3 };

export function TasksView({ state, activeTask, actions, now, onManageTemplates }) {
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const counts = useMemo(
    () => ({
      open: state.tasks.filter((t) => t.status !== 'completed').length,
      completed: state.tasks.filter((t) => t.status === 'completed').length,
      all: state.tasks.length,
    }),
    [state.tasks],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.tasks
      .filter((t) => (filter === 'all' ? true : filter === 'completed' ? t.status === 'completed' : t.status !== 'completed'))
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt - a.createdAt);
  }, [state.tasks, filter, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Tasks</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} w-56 pl-8`} placeholder="Search tasks & notes" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
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
          Create a task from a template (like “New Development”) to get its checklist and estimates, or start an ad-hoc task. Tip: press S anywhere to
          switch or create-and-start in one go.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="Nothing matches">
          {query ? 'Try a different search.' : filter === 'completed' ? 'No completed tasks yet.' : 'All tasks are completed. Nice work.'}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <TaskCard key={t.id} task={t} now={now} actions={actions} hasActive={!!activeTask} />
          ))}
        </div>
      )}

      <NewTaskModal
        open={creating}
        onClose={() => setCreating(false)}
        templates={state.templates}
        onCreate={actions.createTask}
        onManageTemplates={() => {
          setCreating(false);
          onManageTemplates();
        }}
      />
    </div>
  );
}
