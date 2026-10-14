import { useEffect, useMemo, useRef } from 'react';
import { categoryColor } from './ui.jsx';
import { DAY, HOUR, addDays, formatClock, formatDuration, formatTimeOfDay, isSameDay, startOfDay } from '../utils/time.js';
import { sessionsInRange } from '../utils/sessions.js';

const HOUR_PX = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Outlook-style time grid. `days` is a list of day-start timestamps (1 for
 * Day view, 7 for Week view). Each tracked session becomes a block.
 */
export function CalendarGrid({ days, tasks, now, onSelectDay }) {
  const scrollRef = useRef(null);
  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);
  const sessions = useMemo(() => sessionsInRange(tasks, rangeStart, rangeEnd, now), [tasks, rangeStart, rangeEnd, now]);

  // Scroll to the first session of the range, or 7am, once per range.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const first = sessions[0];
    const hour = first ? Math.max(0, new Date(first.startTime).getHours() - 1) : 7;
    el.scrollTop = Math.max(0, Math.min(hour, 7) * HOUR_PX - 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, days.length]);

  const isWeek = days.length > 1;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Day headers */}
      <div className="grid border-b border-slate-200 dark:border-slate-800" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map((d) => {
          const total = clipToDay(sessions, d).reduce((sum, s) => sum + s.duration, 0);
          const today = isSameDay(d, now);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDay?.(d)}
              disabled={!isWeek}
              className={`border-l border-slate-200 px-2 py-2 text-left dark:border-slate-800 ${isWeek ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'cursor-default'}`}
            >
              <div className={`text-xs font-medium uppercase ${today ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {new Date(d).toLocaleDateString([], { weekday: 'short' })}
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  className={`text-lg font-semibold ${
                    today ? 'flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm text-white' : ''
                  }`}
                >
                  {new Date(d).getDate()}
                </span>
                <span className="tabular truncate text-xs text-slate-500">{total > 0 ? formatDuration(total) : ''}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="relative max-h-[calc(100vh-17rem)] min-h-[24rem] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))`, height: 24 * HOUR_PX }}>
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-slate-400" style={{ top: h * HOUR_PX }}>
                {h === 0 ? '' : new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' })}
              </div>
            ))}
          </div>
          {days.map((d) => (
            <DayColumn key={d} dayStart={d} sessions={clipToDay(sessions, d)} now={now} compact={isWeek} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({ dayStart, sessions, now, compact }) {
  const today = isSameDay(dayStart, now);
  const nowTop = ((now - startOfDay(now)) / HOUR) * HOUR_PX;
  return (
    <div className={`relative border-l border-slate-200 dark:border-slate-800 ${today ? 'bg-emerald-50/30 dark:bg-emerald-500/[0.03]' : ''}`}>
      {HOURS.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-slate-100 dark:border-slate-800/80" style={{ top: h * HOUR_PX }}>
          <div className="absolute inset-x-0 border-t border-dashed border-slate-50 dark:border-slate-800/40" style={{ top: HOUR_PX / 2 }} />
        </div>
      ))}

      {sessions.map((s) => (
        <SessionBlock key={`${s.task.id}-${s.startTime}`} session={s} dayStart={dayStart} compact={compact} />
      ))}

      {today && (
        <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }}>
          <div className="relative border-t-2 border-rose-500">
            <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-rose-500" />
          </div>
        </div>
      )}
    </div>
  );
}

function SessionBlock({ session, dayStart, compact }) {
  const { task, startTime, endTime, duration, live } = session;
  const top = ((startTime - dayStart) / HOUR) * HOUR_PX;
  const height = Math.max(3, (duration / HOUR) * HOUR_PX);
  const color = categoryColor(task.category);
  const showText = height >= 22;
  const showTime = height >= 40;
  return (
    <div
      className={`absolute left-1 right-1 overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-xs shadow-sm ${color.block} ${
        live ? 'z-[5] ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900' : ''
      }`}
      style={{ top, height }}
      title={`${task.title}\n${formatTimeOfDay(startTime)} – ${live ? 'now' : formatTimeOfDay(endTime)} (${formatClock(duration)})\n${task.category}`}
    >
      {showText && (
        <div className="flex items-center gap-1 truncate font-semibold leading-tight">
          {live && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />}
          <span className="truncate">{task.title}</span>
        </div>
      )}
      {showTime && (
        <div className="truncate leading-tight opacity-75">
          {formatTimeOfDay(startTime)} – {live ? 'now' : formatTimeOfDay(endTime)}
          {!compact && ` · ${formatDuration(duration)}`}
        </div>
      )}
    </div>
  );
}

/** Sessions overlapping a day, trimmed so a block never spills past midnight. */
function clipToDay(sessions, dayStart) {
  const dayEnd = dayStart + DAY;
  return sessions
    .filter((s) => s.endTime > dayStart && s.startTime < dayEnd)
    .map((s) => {
      const startTime = Math.max(s.startTime, dayStart);
      const endTime = Math.min(s.endTime, dayEnd);
      return { ...s, startTime, endTime, duration: endTime - startTime };
    });
}
