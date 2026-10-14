import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { Button, ProgressBar, STATUS_STYLES, StatusBadge, inputClass } from './ui.jsx';
import { formatClock, formatMinutes, formatTimeOfDay } from '../utils/time.js';
import { taskElapsed, taskEstimate } from '../utils/sessions.js';

export function TaskCard({ task, now, actions, hasActive, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirm, setConfirm] = useState(null); // 'reset' | 'delete' | null
  const elapsed = taskElapsed(task, now);
  const estimate = taskEstimate(task);
  const doneCount = task.subtasks.filter((s) => s.done).length;
  const isActive = task.status === 'active';
  const isCompleted = task.status === 'completed';

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  useEffect(() => {
    if (!confirm) return;
    const id = setTimeout(() => setConfirm(null), 3000);
    return () => clearTimeout(id);
  }, [confirm]);

  return (
    <div
      className={`rounded-xl border border-l-4 bg-white shadow-sm transition-shadow dark:bg-slate-900 ${STATUS_STYLES[task.status].border} ${
        isActive ? 'border-emerald-200 shadow-emerald-100 ring-1 ring-emerald-200 dark:border-emerald-900 dark:shadow-none dark:ring-emerald-900' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`truncate font-semibold ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : ''}`}>{task.title}</span>
              <StatusBadge status={task.status} />
              {task.notes.trim() && <StickyNote className="h-3.5 w-3.5 text-amber-500" aria-label="Has notes" />}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {task.category}
              {task.subtasks.length > 0 && ` · ${doneCount}/${task.subtasks.length} subtasks`}
              {estimate > 0 && ` · est ${formatMinutes(estimate)}`}
              {` · ${task.logs.length + (isActive ? 1 : 0)} session${task.logs.length + (isActive ? 1 : 0) === 1 ? '' : 's'}`}
            </div>
          </div>
        </button>

        <div className="text-right">
          <div className={`tabular font-mono text-lg font-semibold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatClock(elapsed)}
          </div>
          {estimate > 0 && <ProgressBar value={elapsed} max={estimate * 60_000} className="mt-1 w-28" />}
        </div>

        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <Button size="sm" icon={RotateCw} onClick={() => actions.reopen(task.id)}>
              Reopen
            </Button>
          ) : isActive ? (
            <Button size="sm" variant="amber" icon={Pause} onClick={() => actions.pause(task.id)}>
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="primary" icon={hasActive ? ArrowRightLeft : Play} onClick={() => actions.start(task.id)}>
              {hasActive ? 'Switch' : task.status === 'paused' ? 'Resume' : 'Start'}
            </Button>
          )}
          {!isCompleted && (
            <Button size="icon" variant="ghost" icon={CheckCircle2} onClick={() => actions.complete(task.id)} aria-label="Mark complete" title="Mark complete" />
          )}
          <Button
            size="icon"
            variant={confirm === 'reset' ? 'amber' : 'ghost'}
            icon={RotateCcw}
            onClick={() => (confirm === 'reset' ? (actions.reset(task.id), setConfirm(null)) : setConfirm('reset'))}
            aria-label="Reset timer"
            title={confirm === 'reset' ? 'Click again to clear all tracked time' : 'Reset timer'}
            disabled={elapsed === 0 && task.status === 'idle'}
          />
          <Button
            size="icon"
            variant={confirm === 'delete' ? 'danger' : 'ghost'}
            icon={Trash2}
            className={confirm === 'delete' ? 'bg-rose-50 dark:bg-rose-950/50' : ''}
            onClick={() => (confirm === 'delete' ? actions.deleteTask(task.id) : setConfirm('delete'))}
            aria-label="Delete task"
            title={confirm === 'delete' ? 'Click again to delete' : 'Delete task'}
          />
        </div>
        {confirm && (
          <div className="w-full text-right text-xs text-slate-500">
            {confirm === 'reset' ? 'Click reset again to clear all tracked time for this task.' : 'Click delete again to remove this task and its logs.'}
          </div>
        )}
      </div>

      {open && (
        <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-2 dark:border-slate-800">
          <SubtaskList task={task} actions={actions} />
          <div className="space-y-4">
            <NotesBox task={task} onSave={actions.setNotes} />
            <SessionList task={task} now={now} />
          </div>
        </div>
      )}
    </div>
  );
}

function SubtaskList({ task, actions }) {
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState(30);
  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addSubtask(task.id, title.trim(), estimate);
    setTitle('');
  };
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist</h4>
      {task.subtasks.length === 0 && <p className="mb-2 text-sm text-slate-400">No subtasks. Add one below to break this task down.</p>}
      <ul className="space-y-1">
        {task.subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <input
              type="checkbox"
              checked={s.done}
              onChange={() => actions.toggleSubtask(task.id, s.id)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
              id={`st-${s.id}`}
            />
            <label htmlFor={`st-${s.id}`} className={`flex-1 cursor-pointer text-sm ${s.done ? 'text-slate-400 line-through' : ''}`}>
              {s.title}
            </label>
            <span className="text-xs text-slate-400">{formatMinutes(s.estimate)}</span>
            <button
              type="button"
              onClick={() => actions.removeSubtask(task.id, s.id)}
              className="invisible rounded p-0.5 text-slate-400 hover:text-rose-500 group-hover:visible"
              aria-label="Remove subtask"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input className={`${inputClass} py-1.5`} placeholder="Add subtask…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          type="number"
          min="0"
          step="5"
          className={`${inputClass} w-20 py-1.5`}
          value={estimate}
          onChange={(e) => setEstimate(Math.max(0, Number(e.target.value)))}
          aria-label="Estimate in minutes"
          title="Estimate (minutes)"
        />
        <Button type="submit" size="icon" variant="secondary" icon={Plus} aria-label="Add subtask" className="h-auto" />
      </form>
    </div>
  );
}

/** Context log for blockers and quick notes. Saves on a short debounce and on blur. */
function NotesBox({ task, onSave }) {
  const [value, setValue] = useState(task.notes);
  useEffect(() => setValue(task.notes), [task.notes]);
  useEffect(() => {
    if (value === task.notes) return;
    const id = setTimeout(() => onSave(task.id, value), 400);
    return () => clearTimeout(id);
  }, [value, task.id, task.notes, onSave]);

  const stamp = () => {
    const line = `[${new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}] `;
    setValue((v) => (v && !v.endsWith('\n') ? `${v}\n${line}` : `${v}${line}`));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes / context log</h4>
        <button type="button" onClick={stamp} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          + timestamp
        </button>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value !== task.notes && onSave(task.id, value)}
        placeholder="Blockers, decisions, links… e.g. Waiting on data warehouse access"
        className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
      />
    </div>
  );
}

function SessionList({ task, now }) {
  const sessions = [...task.logs].reverse().slice(0, 5);
  if (!task.activeStart && sessions.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent sessions</h4>
      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
        {task.activeStart && (
          <li className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
            <span>{formatTimeOfDay(task.activeStart)} – now</span>
            <span className="tabular font-mono">{formatClock(now - task.activeStart)}</span>
          </li>
        )}
        {sessions.map((l) => (
          <li key={l.startTime} className="flex justify-between">
            <span>
              {new Date(l.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {formatTimeOfDay(l.startTime)} – {formatTimeOfDay(l.endTime)}
            </span>
            <span className="tabular font-mono">{formatClock(l.duration)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
