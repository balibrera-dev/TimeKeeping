import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  MessageSquare,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { Button, ClientBadge, ClientSelect, ProgressBar, StatusBadge, inputClass, taskColor } from './ui.jsx';
import { CommentBox } from './CommentBox.jsx';
import { INTERRUPTIONS } from '../types/index.js';
import { formatClock, formatMinutes, formatTimeOfDay, parseDuration } from '../utils/time.js';
import { subtaskTitle, subtaskTotals, taskElapsed, taskEstimate, trackedSubtaskTotals } from '../utils/sessions.js';

/** A task row. Collapsed by default; expand for subtasks, comments and sessions. */
export function TaskCard({ task, now, actions, hasActive, clients, settings, onManageClients }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'reset' | 'delete' | null
  const elapsed = taskElapsed(task, now);
  const estimate = taskEstimate(task);
  const doneCount = task.subtasks.filter((s) => s.done).length;
  const isActive = task.status === 'active';
  const isCompleted = task.status === 'completed';
  const isInterruption = task.kind === 'interruption';
  const client = clients.find((c) => c.id === task.clientId);
  const color = taskColor(task, clients);
  const current = task.subtasks.find((s) => s.id === task.currentSubtaskId);
  const hasComments = task.notes.trim() || task.subtasks.some((s) => s.notes?.trim());
  const sessionCount = task.logs.length + (isActive ? 1 : 0);

  useEffect(() => {
    if (!confirm) return;
    const id = setTimeout(() => setConfirm(null), 3000);
    return () => clearTimeout(id);
  }, [confirm]);

  return (
    <div
      className={`rounded-xl border border-l-4 bg-white shadow-sm transition-shadow dark:bg-slate-900 ${
        isActive ? 'border-emerald-200 shadow-emerald-100 ring-1 ring-emerald-200 dark:border-emerald-900 dark:shadow-none dark:ring-emerald-900' : 'border-slate-200 dark:border-slate-800'
      }`}
      style={{ borderLeftColor: color }}
    >
      {/* Phone: title on its own row, then timer + controls. sm+: one row. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 basis-full items-start gap-2 text-left sm:flex-1 sm:basis-0 sm:items-center"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`line-clamp-2 min-w-0 break-words font-semibold sm:line-clamp-1 ${isCompleted ? 'text-slate-500 line-through decoration-slate-300' : ''}`}
              >
                {task.title}
              </span>
              <StatusBadge status={task.status} />
              <ClientBadge client={client} />
              {isInterruption && (
                <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: color }}>
                  {INTERRUPTIONS[task.interruptType]?.label}
                </span>
              )}
              {hasComments && <MessageSquare className="h-3.5 w-3.5 text-amber-500" aria-label="Has comments" />}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 sm:truncate dark:text-slate-400">
              {task.category}
              {task.subtasks.length > 0 && ` · ${doneCount}/${task.subtasks.length} subtasks`}
              {estimate > 0 && ` · est ${formatMinutes(estimate)}`}
              {` · ${sessionCount} session${sessionCount === 1 ? '' : 's'}`}
            </div>
            {current && !isCompleted && (
              <div className={`mt-0.5 flex min-w-0 items-center gap-1 text-xs ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="shrink-0">{isActive ? 'Tracking' : 'Last on'}:</span>
                <span className="truncate font-medium">{current.title}</span>
              </div>
            )}
          </div>
        </button>

        <div className="flex w-full items-center justify-between gap-2 sm:contents">
        <div className="sm:text-right">
          <div className={`tabular font-mono text-base font-semibold sm:text-lg ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {formatClock(elapsed)}
          </div>
          {estimate > 0 && <ProgressBar value={elapsed} max={estimate * 60_000} className="mt-1 w-20 sm:w-28" />}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1.5">
          {isCompleted ? (
            !isInterruption && (
              <Button size="sm" icon={RotateCw} onClick={() => actions.reopen(task.id)}>
                Reopen
              </Button>
            )
          ) : isActive ? (
            <Button size="sm" variant="amber" icon={Pause} onClick={() => actions.pause(task.id)}>
              {isInterruption ? 'End' : 'Pause'}
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
        </div>
        {confirm && (
          <div className="basis-full text-right text-xs text-slate-500">
            {confirm === 'reset' ? 'Click reset again to clear all tracked time for this task.' : 'Click delete again to remove this task and its logs.'}
          </div>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-slate-100 p-3 sm:p-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] dark:border-slate-800">
          <SubtaskList task={task} now={now} actions={actions} client={client} allowTimeEdits={settings?.allowTimeEdits ?? true} />
          <div className="min-w-0 space-y-4">
            {!isInterruption && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Client</h4>
                <ClientSelect clients={clients} value={task.clientId} onChange={(clientId) => actions.updateTask(task.id, { clientId })} onManage={onManageClients} />
              </div>
            )}
            {(task.subtasks.length === 0 || task.notes.trim()) && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{task.subtasks.length ? 'General comment' : 'Comment'}</h4>
                <CommentBox
                  value={task.notes}
                  onSave={(notes) => actions.setNotes(task.id, notes)}
                  context={{ task: task.title, client: client?.name }}
                  placeholder="Blockers, decisions, links… e.g. Waiting on data warehouse access"
                />
              </div>
            )}
            <SessionList task={task} now={now} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Checklist where each subtask carries its own tracked time and one comment.
 * Clicking a subtask's name puts the timer on it (starting or switching the task).
 */
function SubtaskList({ task, now, actions, client, allowTimeEdits }) {
  const [title, setTitle] = useState('');
  const [estimate, setEstimate] = useState(30);
  const [commentOpen, setCommentOpen] = useState(null);
  const totals = subtaskTotals(task, now);
  const tracked = trackedSubtaskTotals(task, now);
  const known = new Set(task.subtasks.map((s) => s.id));
  let unassigned = 0;
  for (const [id, ms] of totals) if (!known.has(id)) unassigned += ms;
  const isActive = task.status === 'active';
  const canTrack = task.status !== 'completed';

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.addSubtask(task.id, title.trim(), estimate);
    setTitle('');
  };

  return (
    <div>
      <h4 className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Subtasks
        {task.subtasks.length > 0 && canTrack && <span className="font-normal normal-case tracking-normal text-slate-400">Click a subtask to track time on it</span>}
      </h4>
      {task.subtasks.length === 0 && <p className="mb-2 text-sm text-slate-400">No subtasks. Add one below to break this task down and track time per step.</p>}
      <ul className="space-y-1">
        {task.subtasks.map((s) => {
          const isCurrent = task.currentSubtaskId === s.id;
          const tracking = isCurrent && isActive;
          const spent = totals.get(s.id) ?? 0;
          const over = s.estimate > 0 && spent > s.estimate * 60_000;
          const showComment = commentOpen === s.id;
          return (
            <li key={s.id} className={`rounded-md ${tracking ? 'bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-900' : ''}`}>
              <div className="group flex items-center gap-2 px-1.5 py-1">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={() => actions.toggleSubtask(task.id, s.id)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
                  aria-label={`Mark “${s.title}” ${s.done ? 'not done' : 'done'}`}
                />
                <button
                  type="button"
                  disabled={!canTrack}
                  onClick={() => actions.start(task.id, s.id)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded text-left text-sm ${canTrack ? 'hover:text-emerald-700 dark:hover:text-emerald-400' : 'cursor-default'} ${
                    s.done ? 'text-slate-400 line-through' : ''
                  }`}
                  title={tracking ? 'Timer is on this subtask' : canTrack ? 'Track time on this subtask' : undefined}
                >
                  {tracking ? (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  ) : isCurrent && canTrack ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" title="Last tracked subtask" />
                  ) : (
                    <Play className="h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 dark:text-slate-600" aria-hidden="true" />
                  )}
                  <span className="line-clamp-2 break-words sm:line-clamp-1">{s.title}</span>
                </button>
                <SubtaskTime
                  subtask={s}
                  spent={spent}
                  tracked={tracked.get(s.id) ?? 0}
                  tracking={tracking}
                  over={over}
                  editable={allowTimeEdits && s.done}
                  onSave={(ms) => actions.setSubtaskTime(task.id, s.id, ms)}
                />
                <button
                  type="button"
                  onClick={() => setCommentOpen(showComment ? null : s.id)}
                  className={`rounded p-0.5 ${s.notes?.trim() ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600'}`}
                  aria-label={s.notes?.trim() ? 'Edit comment' : 'Add comment'}
                  title={s.notes?.trim() ? 'Edit comment' : 'Add comment'}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => actions.removeSubtask(task.id, s.id)}
                  className="invisible rounded p-0.5 text-slate-400 hover:text-rose-500 group-hover:visible pointer-coarse:visible"
                  aria-label="Remove subtask"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {showComment ? (
                <div className="px-1.5 pb-2 pl-7">
                  <CommentBox
                    value={s.notes ?? ''}
                    onSave={(notes) => actions.setSubtaskNotes(task.id, s.id, notes)}
                    context={{ task: task.title, subtask: s.title, client: client?.name }}
                    placeholder={`Comment on “${s.title}”…`}
                    autoFocus
                  />
                </div>
              ) : (
                s.notes?.trim() && (
                  <button
                    type="button"
                    onClick={() => setCommentOpen(s.id)}
                    className="block w-full truncate px-1.5 pb-1 pl-7 text-left text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {s.notes.trim().split('\n').slice(-1)[0]}
                  </button>
                )
              )}
            </li>
          );
        })}
        {task.subtasks.length > 0 && unassigned > 0 && (
          <li className="flex items-center justify-between px-1.5 py-1 pl-7 text-xs text-slate-500 dark:text-slate-400">
            <span>Not on a subtask</span>
            <span className="tabular font-mono">{formatClock(unassigned)}</span>
          </li>
        )}
      </ul>
      <form onSubmit={add} className="mt-2 flex gap-2">
        <input className={`${inputClass} min-w-0 py-1.5`} placeholder="Add subtask…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input
          type="number"
          min="0"
          step="5"
          className={`${inputClass} w-20! shrink-0 py-1.5`}
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

function SessionList({ task, now }) {
  const sessions = [...task.logs].reverse().slice(0, 5);
  if (!task.activeStart && sessions.length === 0) return null;
  const current = subtaskTitle(task, task.currentSubtaskId);
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent sessions</h4>
      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
        {task.activeStart && (
          <li className="flex justify-between gap-2 font-medium text-emerald-600 dark:text-emerald-400">
            <span className="min-w-0 sm:truncate">
              {formatTimeOfDay(task.activeStart)} – now{current && ` · ${current}`}
            </span>
            <span className="tabular shrink-0 font-mono">{formatClock(now - task.activeStart)}</span>
          </li>
        )}
        {sessions.map((l) => {
          const st = subtaskTitle(task, l.subtaskId);
          return (
            <li key={l.startTime} className="flex justify-between gap-2">
              <span className="min-w-0 sm:truncate">
                {new Date(l.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {formatTimeOfDay(l.startTime)} – {formatTimeOfDay(l.endTime)}
                {st && ` · ${st}`}
              </span>
              <span className="tabular shrink-0 font-mono">{formatClock(l.duration)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A subtask's time against its estimate. On a completed subtask (when the
 * setting allows it) clicking the time lets you type the real total.
 */
function SubtaskTime({ subtask, spent, tracked, tracking, over, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const cancelled = useRef(false);
  const edited = subtask.done && subtask.timeOverride != null;

  useEffect(() => {
    if (!editable) setEditing(false);
  }, [editable]);

  const begin = () => {
    setDraft(formatClock(spent));
    setInvalid(false);
    cancelled.current = false;
    setEditing(true);
  };
  const commit = () => {
    if (cancelled.current) return;
    const ms = parseDuration(draft);
    if (ms == null) {
      setInvalid(true);
      return;
    }
    // Typing back the timer's own value just clears the edit.
    onSave(Math.round(ms / 1000) === Math.round(tracked / 1000) ? null : ms);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        className="flex shrink-0 items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cancelled.current = true;
              setEditing(false);
            }
          }}
          onBlur={commit}
          aria-label={`Total time for ${subtask.title}`}
          title="e.g. 1:30, 90 (minutes), 1h 30m"
          className={`${inputClass} h-6 w-24 px-1.5 py-0 font-mono text-xs ${invalid ? 'ring-rose-500 focus:ring-rose-500' : ''}`}
        />
        {edited && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              cancelled.current = true;
              onSave(null);
              setEditing(false);
            }}
            className="text-[11px] font-medium text-slate-500 hover:underline"
            title={`Back to the tracked ${formatClock(tracked)}`}
          >
            Reset
          </button>
        )}
      </form>
    );
  }

  const label = (
    <>
      {spent > 0 ? formatClock(spent) : '–'}
      {edited && <span className="font-sans text-amber-600 dark:text-amber-400">*</span>}
      <span className="font-sans font-normal text-slate-400"> / {formatMinutes(subtask.estimate)}</span>
    </>
  );
  const tone = tracking
    ? 'font-semibold text-emerald-700 dark:text-emerald-400'
    : over
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-slate-500 dark:text-slate-400';
  const title = edited
    ? `Edited to ${formatClock(spent)} (timer tracked ${formatClock(tracked)})`
    : `Tracked ${formatClock(spent)}${subtask.estimate ? ` of ${formatMinutes(subtask.estimate)} estimated` : ''}`;

  if (!editable) {
    return (
      <span className={`tabular shrink-0 font-mono text-xs ${tone}`} title={title}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={begin}
      className={`tabular group/time inline-flex shrink-0 items-center gap-1 rounded px-1 font-mono text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${tone}`}
      title={`${title}. Click to edit.`}
    >
      {label}
      <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover/time:opacity-100" aria-hidden="true" />
    </button>
  );
}
