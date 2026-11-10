import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui.jsx';
import { CALENDAR_ZOOMS, CalendarGrid, zoomFor } from './CalendarGrid.jsx';
import { MetricsPanel } from './MetricsPanel.jsx';
import { addDays, formatDateLong, formatDateShort, isSameDay, startOfDay, startOfWeek } from '../utils/time.js';
import { sessionsInRange, workSessions } from '../utils/sessions.js';

const ZOOM_KEY = 'balisoft-timekeeping:calendarZoom';

/** Remembered per browser; a blocked or empty storage just means the 1 h default. */
function loadZoom() {
  try {
    return zoomFor(Number(localStorage.getItem(ZOOM_KEY))).minutes;
  } catch {
    return 60;
  }
}

export function CalendarView({ tasks, clients, now }) {
  const [mode, setMode] = useState('day');
  const [zoom, setZoomState] = useState(loadZoom);
  const setZoom = (minutes) => {
    setZoomState(minutes);
    try {
      localStorage.setItem(ZOOM_KEY, String(minutes));
    } catch {
      // Not saved; the zoom still applies until reload.
    }
  };
  const zoomIndex = CALENDAR_ZOOMS.findIndex((z) => z.minutes === zoom);
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));

  const days = useMemo(() => {
    if (mode === 'day') return [startOfDay(anchor)];
    const ws = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [mode, anchor]);

  const rangeEnd = addDays(days[days.length - 1], 1);
  // Metrics count work only; Idle still shows on the grid.
  const sessions = useMemo(() => workSessions(sessionsInRange(tasks, days[0], rangeEnd, now)), [tasks, days, rangeEnd, now]);

  const step = (dir) => setAnchor((a) => addDays(a, dir * (mode === 'day' ? 1 : 7)));
  const isCurrent = mode === 'day' ? isSameDay(anchor, now) : startOfWeek(anchor) === startOfWeek(now);
  const title = mode === 'day' ? formatDateLong(anchor) : `${formatDateShort(days[0])} – ${formatDateShort(days[6])}`;
  const label = mode === 'day' ? (isSameDay(anchor, now) ? 'today' : 'this day') : 'this week';

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

        <div className="flex items-center gap-1" role="group" aria-label="Calendar zoom">
          <Button
            variant="ghost"
            size="icon"
            icon={ZoomOut}
            onClick={() => setZoom(CALENDAR_ZOOMS[zoomIndex - 1].minutes)}
            disabled={zoomIndex <= 0}
            aria-label="Zoom out"
            title="Zoom out"
          />
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
            {CALENDAR_ZOOMS.map((z) => (
              <button
                key={z.minutes}
                type="button"
                onClick={() => setZoom(z.minutes)}
                aria-pressed={zoom === z.minutes}
                className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ${zoom === z.minutes ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-600 dark:text-slate-400'}`}
                title={`One row per ${z.label}`}
              >
                {z.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            icon={ZoomIn}
            onClick={() => setZoom(CALENDAR_ZOOMS[zoomIndex + 1].minutes)}
            disabled={zoomIndex >= CALENDAR_ZOOMS.length - 1}
            aria-label="Zoom in"
            title="Zoom in"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <CalendarGrid
          days={days}
          tasks={tasks}
          clients={clients}
          now={now}
          zoom={zoom}
          onSelectDay={(d) => {
            setAnchor(d);
            setMode('day');
          }}
        />
        <MetricsPanel sessions={sessions} now={now} label={label} clients={clients} />
      </div>
    </div>
  );
}
