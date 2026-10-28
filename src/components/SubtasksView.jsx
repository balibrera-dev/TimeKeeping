import { useMemo, useState } from 'react';
import { ArrowDown, ArrowRightLeft, ArrowUp, ListChecks, MessageSquare, Pause, Play, Search } from 'lucide-react';
import { ClientBadge, ClientSelect, EmptyState, ProgressBar, inputClass } from './ui.jsx';
import { JiraChips } from './Jira.jsx';
import { DEFAULT_SETTINGS } from '../utils/reducer.js';
import { subtaskTotals } from '../utils/sessions.js';
import { formatClock, formatMinutes } from '../utils/time.js';

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

const MATCHERS = {
  open: (r) => !r.done,
  done: (r) => r.done,
  all: () => true,
};

const COLUMNS = [
  { id: 'subtask', label: 'Subtask', value: (r) => r.subtask.title.toLowerCase() },
  { id: 'task', label: 'Task', value: (r) => r.taskIndex * 1000 + r.subtaskIndex },
  { id: 'tracked', label: 'Tracked', value: (r) => r.spent, numeric: true },
  { id: 'estimate', label: 'Estimate', value: (r) => r.subtask.estimate, numeric: true },
  { id: 'progress', label: 'Progress', value: (r) => (r.subtask.estimate > 0 ? r.spent / (r.subtask.estimate * 60_000) : -1), numeric: true },
];

/**
 * Every subtask of every task in one table, with its task as a column. Click
 * a row's play button (or its name) to put the timer on that subtask; it
 * switches from whatever is running in one click, like the Tasks page.
 */
export function SubtasksView({ state, actions, now, onOpenTasks }) {
  const [filter, setFilter] = useState('open');
  const [query, setQuery] = useState('');
  const [clientFilter, setClientFilter] = useState(null);
  const [sort, setSort] = useState({ id: 'task', dir: 1 });
  const settings = { ...DEFAULT_SETTINGS, ...state.settings };
  const running = state.tasks.find((t) => t.status === 'active');

  const allRows = useMemo(() => {
    const rows = [];
    state.tasks.forEach((task, taskIndex) => {
      if (task.kind === 'interruption') return;
      const totals = subtaskTotals(task, now);
      const client = state.clients.find((c) => c.id === task.clientId);
      task.subtasks.forEach((subtask, subtaskIndex) => {
        const isCurrent = task.currentSubtaskId === subtask.id;
        rows.push({
          key: `${task.id}:${subtask.id}`,
          task,
          subtask,
          client,
          taskIndex,
          subtaskIndex,
          spent: totals.get(subtask.id) ?? 0,
          tracking: isCurrent && task.status === 'active',
          last: isCurrent && task.status === 'paused',
          done: subtask.done || task.status === 'completed',
          canTrack: task.status !== 'completed',
        });
      });
    });
    return rows;
  }, [state.tasks, state.clients, now]);

  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, allRows.filter(MATCHERS[f.id]).length]));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (r) =>
      !q ||
      r.subtask.title.toLowerCase().includes(q) ||
      r.task.title.toLowerCase().includes(q) ||
      r.task.category.toLowerCase().includes(q) ||
      (r.client?.name.toLowerCase() ?? '').includes(q) ||
      r.task.jiraStory?.toLowerCase().includes(q) ||
      r.task.jiraParent?.toLowerCase().includes(q) ||
      r.subtask.notes?.toLowerCase().includes(q);
    const col = COLUMNS.find((c) => c.id === sort.id) ?? COLUMNS[1];
    return allRows
      .filter(MATCHERS[filter])
      .filter((r) => !clientFilter || r.task.clientId === clientFilter)
      .filter(matches)
      .sort((a, b) => {
        const va = col.value(a);
        const vb = col.value(b);
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir || a.taskIndex - b.taskIndex || a.subtaskIndex - b.subtaskIndex;
      });
  }, [allRows, filter, query, clientFilter, sort]);

  const totals = rows.reduce((acc, r) => ({ spent: acc.spent + r.spent, estimate: acc.estimate + (Number(r.subtask.estimate) || 0) }), { spent: 0, estimate: 0 });
  const toggleSort = (id) => setSort((s) => (s.id === id ? { id, dir: -s.dir } : { id, dir: COLUMNS.find((c) => c.id === id)?.numeric ? -1 : 1 }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Subtasks</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className={`${inputClass} w-56 pl-8`} placeholder="Search subtasks, tasks, Jira" value={query} onChange={(e) => setQuery(e.target.value)} />
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
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === f.id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {f.label} <span className="text-slate-400">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {allRows.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No subtasks yet"
          action={
            <button type="button" onClick={onOpenTasks} className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Go to Tasks
            </button>
          }
        >
          Subtasks you add to your tasks show up here in one list, so you can see every step and jump the timer between them. Tasks made from a template already
          have subtasks.
        </EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState icon={Search} title="Nothing matches">
          {query || clientFilter ? 'Try a different search or client.' : filter === 'done' ? 'No subtasks are done yet.' : 'Every subtask is done. Nice work.'}
        </EmptyState>
      ) : (
        <>
          {/* Phone: one card per subtask. */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => (
              <li
                key={r.key}
                className={`rounded-xl border border-l-4 bg-white p-3 dark:bg-slate-900 ${
                  r.tracking ? 'border-emerald-200 ring-1 ring-emerald-200 dark:border-emerald-900 dark:ring-emerald-900' : 'border-slate-200 dark:border-slate-800'
                }`}
                style={{ borderLeftColor: r.client?.color ?? '#94a3b8' }}
              >
                <div className="flex items-start gap-3">
                  <TrackButton row={r} running={running} actions={actions} />
                  <div className="min-w-0 flex-1">
                    <SubtaskName row={r} actions={actions} />
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="min-w-0 break-words">{r.task.title}</span>
                      <ClientBadge client={r.client} />
                    </div>
                    <JiraChips task={r.task} domain={settings.jiraDomain} className="mt-1" />
                    <div className="mt-2 flex items-center gap-2">
                      <TimeCell row={r} />
                      <ProgressBar value={r.spent} max={r.subtask.estimate * 60_000} className="max-w-28 flex-1" />
                    </div>
                  </div>
                  <DoneBox row={r} actions={actions} />
                </div>
              </li>
            ))}
          </ul>

          {/* Tablet and desktop: a table. */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <th className="w-12 px-3 py-2 font-semibold">
                    <span className="sr-only">Track</span>
                  </th>
                  <SortHeader id="subtask" sort={sort} onSort={toggleSort} />
                  <SortHeader id="task" sort={sort} onSort={toggleSort} />
                  <th className="px-3 py-2 font-semibold">Jira</th>
                  <SortHeader id="tracked" sort={sort} onSort={toggleSort} align="right" />
                  <SortHeader id="estimate" sort={sort} onSort={toggleSort} align="right" />
                  <SortHeader id="progress" sort={sort} onSort={toggleSort} />
                  <th className="w-14 px-3 py-2 text-center font-semibold">Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => (
                  <tr key={r.key} className={r.tracking ? 'bg-emerald-50/70 dark:bg-emerald-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                    <td className="px-3 py-2">
                      <TrackButton row={r} running={running} actions={actions} />
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <SubtaskName row={r} actions={actions} />
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-slate-700 dark:text-slate-300" title={r.task.title}>
                          {r.task.title}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <ClientBadge client={r.client} />
                        <span className="truncate">{r.task.category}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <JiraChips task={r.task} domain={settings.jiraDomain} className="flex-col items-start" />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`tabular font-mono text-xs ${r.tracking ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {r.spent > 0 ? formatClock(r.spent) : '–'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{r.subtask.estimate > 0 ? formatMinutes(r.subtask.estimate) : '–'}</td>
                    <td className="px-3 py-2">
                      <Progress row={r} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <DoneBox row={r} actions={actions} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <td />
                  <td className="px-3 py-2 font-medium" colSpan={3}>
                    {rows.length} subtask{rows.length === 1 ? '' : 's'}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono">{formatClock(totals.spent)}</td>
                  <td className="px-3 py-2 text-right">{formatMinutes(totals.estimate)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tasks without subtasks aren’t listed here. Calls and breaks stay on the Tasks page.
          </p>
        </>
      )}
    </div>
  );
}

function SortHeader({ id, sort, onSort, align }) {
  const col = COLUMNS.find((c) => c.id === id);
  const active = sort.id === id;
  const Arrow = sort.dir > 0 ? ArrowUp : ArrowDown;
  return (
    <th className={`px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : ''}`} aria-sort={active ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(id)} className={`inline-flex items-center gap-1 uppercase hover:text-slate-800 dark:hover:text-slate-200 ${active ? 'text-slate-800 dark:text-slate-200' : ''}`}>
        {col.label}
        {active && <Arrow className="h-3 w-3" aria-hidden="true" />}
      </button>
    </th>
  );
}

/** Start, switch to, or pause the timer on this subtask. */
function TrackButton({ row, running, actions }) {
  if (row.tracking) {
    return (
      <button
        type="button"
        onClick={() => actions.pause(row.task.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-400"
        aria-label={`Pause ${row.subtask.title}`}
        title="Pause"
      >
        <Pause className="h-4 w-4" />
      </button>
    );
  }
  const Icon = running ? ArrowRightLeft : Play;
  return (
    <button
      type="button"
      disabled={!row.canTrack}
      onClick={() => actions.start(row.task.id, row.subtask.id)}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:ring-slate-200 dark:text-emerald-400 dark:ring-emerald-900 dark:hover:bg-emerald-500/10 dark:disabled:text-slate-600 dark:disabled:ring-slate-800"
      aria-label={`${running ? 'Switch to' : 'Start'} ${row.subtask.title}`}
      title={row.canTrack ? (running ? 'Switch the timer to this subtask' : 'Start the timer on this subtask') : 'Reopen the task to track time'}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SubtaskName({ row, actions }) {
  const { subtask } = row;
  return (
    <button
      type="button"
      disabled={!row.canTrack || row.tracking}
      onClick={() => actions.start(row.task.id, subtask.id)}
      className={`flex max-w-full items-center gap-2 text-left font-medium enabled:hover:text-emerald-700 dark:enabled:hover:text-emerald-400 ${
        row.done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'
      }`}
      title={row.tracking ? 'Timer is on this subtask' : row.canTrack ? 'Track time on this subtask' : undefined}
    >
      {row.tracking ? (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : row.last ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Last tracked subtask of a paused task" />
      ) : null}
      <span className="break-words">{subtask.title}</span>
      {subtask.notes?.trim() && <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Has a comment" />}
    </button>
  );
}

function TimeCell({ row }) {
  return (
    <span className={`tabular shrink-0 font-mono text-xs ${row.tracking ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
      {row.spent > 0 ? formatClock(row.spent) : '–'}
      <span className="font-sans font-normal text-slate-400"> / {row.subtask.estimate > 0 ? formatMinutes(row.subtask.estimate) : '–'}</span>
    </span>
  );
}

function Progress({ row }) {
  const est = row.subtask.estimate * 60_000;
  if (!est) return <span className="text-xs text-slate-400">No estimate</span>;
  const pct = Math.round((row.spent / est) * 100);
  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={row.spent} max={est} className="w-24" />
      <span className={`tabular w-10 text-right text-xs ${pct > 100 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{pct}%</span>
    </div>
  );
}

function DoneBox({ row, actions }) {
  return (
    <input
      type="checkbox"
      checked={row.subtask.done}
      disabled={!row.canTrack}
      onChange={() => actions.toggleSubtask(row.task.id, row.subtask.id)}
      className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600 disabled:opacity-50 md:mt-0"
      aria-label={`Mark “${row.subtask.title}” ${row.subtask.done ? 'not done' : 'done'}`}
    />
  );
}
