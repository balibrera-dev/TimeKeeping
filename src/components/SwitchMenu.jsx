import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightLeft, Play, Plus, Search } from 'lucide-react';
import { STATUS_STYLES, taskColor } from './ui.jsx';
import { formatClock } from '../utils/time.js';
import { taskElapsed } from '../utils/sessions.js';

/**
 * One-click task switcher. Picking a task pauses the running one and starts
 * the picked one in a single state update. Typing a name that doesn't exist
 * lets you create an ad-hoc task (Enter creates it without starting; the
 * second option creates and starts it).
 */
export function SwitchMenu({ tasks, clients, activeTask, now, onSwitch, onQuickCreate, open, setOpen }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => t.status !== 'completed' && t.id !== activeTask?.id)
      .filter((t) => {
        if (!q) return true;
        const client = clients.find((c) => c.id === t.clientId);
        return t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || client?.name.toLowerCase().includes(q);
      })
      .sort((a, b) => lastTouched(b) - lastTouched(a));
  }, [tasks, clients, activeTask, query]);

  const canCreate = query.trim().length > 0 && !tasks.some((t) => t.title.toLowerCase() === query.trim().toLowerCase());
  const itemCount = candidates.length + (canCreate ? 2 : 0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, setOpen]);

  useEffect(() => setCursor(0), [query]);

  const choose = (index) => {
    if (index < candidates.length) onSwitch(candidates[index].id);
    else if (canCreate) onQuickCreate(query.trim(), index > candidates.length);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(itemCount - 1, c + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === 'Enter' && itemCount > 0) {
      e.preventDefault();
      choose(cursor);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        title="Switch task (S)"
      >
        <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
        Switch
        <kbd className="hidden rounded bg-white/15 px-1.5 font-mono text-[10px] sm:inline dark:bg-slate-900/10">S</kbd>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,26rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 dark:border-slate-800">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Switch to… or type a new task name"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {candidates.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${cursor === i ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: taskColor(t, clients) }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.title}</span>
                    <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                      {[clients.find((c) => c.id === t.clientId)?.name, t.category, STATUS_STYLES[t.status].label].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="tabular font-mono text-xs text-slate-500 dark:text-slate-400">{formatClock(taskElapsed(t, now))}</span>
                  <Play className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                </button>
              </li>
            ))}
            {canCreate &&
              [
                { icon: Plus, label: 'Create', offset: 0 },
                { icon: Play, label: 'Create & start', offset: 1 },
              ].map(({ icon: Icon, label, offset }) => {
                const i = candidates.length + offset;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => choose(i)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${cursor === i ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}
                    >
                      <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span>
                        {label} <span className="font-semibold">“{query.trim()}”</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            {itemCount === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No other open tasks. Type a name to create one.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function lastTouched(task) {
  const last = task.logs[task.logs.length - 1];
  return last ? last.endTime : task.createdAt;
}
