import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from './ui.jsx';
import { CalendarGrid } from './CalendarGrid.jsx';
import { MetricsPanel } from './MetricsPanel.jsx';
import { addDays, formatDateLong, formatDateShort, isSameDay, startOfDay, startOfWeek } from '../utils/time.js';
import { sessionsInRange } from '../utils/sessions.js';
import { exportDay } from '../utils/export.js';

export function CalendarView({ tasks, now }) {
  const [mode, setMode] = useState('day');
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));
  const [flash, setFlash] = useState('');

  const days = useMemo(() => {
    if (mode === 'day') return [startOfDay(anchor)];
    const ws = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [mode, anchor]);

  const rangeEnd = addDays(days[days.length - 1], 1);
  const sessions = useMemo(() => sessionsInRange(tasks, days[0], rangeEnd, now), [tasks, days, rangeEnd, now]);

  const step = (dir) => setAnchor((a) => addDays(a, dir * (mode === 'day' ? 1 : 7)));
  const isCurrent = mode === 'day' ? isSameDay(anchor, now) : startOfWeek(anchor) === startOfWeek(now);
  const title = mode === 'day' ? formatDateLong(anchor) : `${formatDateShort(days[0])} – ${formatDateShort(days[6])}`;
  const label = mode === 'day' ? (isSameDay(anchor, now) ? 'today' : 'this day') : 'this week';
  const exportDayTs = mode === 'day' ? anchor : isCurrent ? startOfDay(now) : anchor;

  const doExport = (format) => {
    const n = exportDay(tasks, exportDayTs, format, Date.now());
    setFlash(n ? `Exported ${n} session${n === 1 ? '' : 's'} for ${formatDateShort(exportDayTs)}` : `No sessions on ${formatDateShort(exportDayTs)}, exported an empty file`);
    setTimeout(() => setFlash(''), 3500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          {['day', 'week'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-sm font-medium capitalize ${mode === m ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" icon={ChevronLeft} onClick={() => step(-1)} aria-label="Previous" />
          <Button variant="secondary" size="sm" onClick={() => setAnchor(startOfDay(Date.now()))} disabled={isCurrent}>
            Today
          </Button>
          <Button variant="ghost" size="icon" icon={ChevronRight} onClick={() => step(1)} aria-label="Next" />
        </div>
        <h1 className="mr-auto text-lg font-semibold">{title}</h1>

        <div className="flex items-center gap-2">
          {flash && <span className="text-xs text-emerald-600 dark:text-emerald-400">{flash}</span>}
          <span className="hidden items-center gap-1 text-xs text-slate-500 md:flex">
            <Download className="h-3.5 w-3.5" /> {formatDateShort(exportDayTs)}
          </span>
          <Button size="sm" icon={FileSpreadsheet} onClick={() => doExport('csv')}>
            CSV
          </Button>
          <Button size="sm" icon={FileJson} onClick={() => doExport('json')}>
            JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CalendarGrid
          days={days}
          tasks={tasks}
          now={now}
          onSelectDay={(d) => {
            setAnchor(d);
            setMode('day');
          }}
        />
        <MetricsPanel sessions={sessions} now={now} label={label} />
      </div>
    </div>
  );
}
