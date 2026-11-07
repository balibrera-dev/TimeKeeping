import { useEffect, useRef, useState } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button, inputClass } from './ui.jsx';
import { exportDay } from '../utils/export.js';
import { addDays, formatDateShort, isoDate, startOfDay } from '../utils/time.js';

/** Parse a yyyy-mm-dd input value as a local day. */
const dayFromInput = (value) => {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d).getTime() : null;
};

/** Header download icon: pick a day (today by default) and get its time log as CSV or JSON. */
export function DownloadMenu({ tasks, clients }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(() => isoDate(Date.now()));
  const [flash, setFlash] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDay(isoDate(Date.now()));
    setFlash('');
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const dayTs = dayFromInput(day) ?? startOfDay(Date.now());
  const download = (format) => {
    const n = exportDay(tasks, dayTs, format, Date.now(), clients);
    setFlash(n ? `Downloaded ${n} session${n === 1 ? '' : 's'} for ${formatDateShort(dayTs)}.` : `No sessions on ${formatDateShort(dayTs)}, so the file is empty.`);
  };
  const shortcut = (offset) => setDay(isoDate(addDays(startOfDay(Date.now()), offset)));

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        icon={Download}
        onClick={() => setOpen((o) => !o)}
        aria-label="Download time log"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Download time log"
      />
      {open && (
        <div
          role="dialog"
          aria-label="Download time log"
          className="fixed inset-x-4 top-14 z-40 space-y-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div>
            <div className="text-sm font-semibold">Download time log</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Every session of one day, for timesheets or a backup.</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Day</span>
            <input type="date" className={`${inputClass} py-1.5`} value={day} max={isoDate(Date.now())} onChange={(e) => setDay(e.target.value)} />
          </label>
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => shortcut(0)} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Today
            </button>
            <button type="button" onClick={() => shortcut(-1)} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
              Yesterday
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" icon={FileSpreadsheet} onClick={() => download('csv')}>
              CSV
            </Button>
            <Button size="sm" icon={FileJson} onClick={() => download('json')}>
              JSON
            </Button>
          </div>
          {flash && (
            <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
              {flash}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
