import { DAY, isoDate, isoLocal, startOfDay } from './time.js';
import { sessionsInRange } from './sessions.js';

/** Flat rows for one day's sessions (open session clipped at `now`). */
export function dayLogRows(tasks, dayTs, now) {
  const start = startOfDay(dayTs);
  return sessionsInRange(tasks, start, start + DAY, now).map((s) => ({
    date: isoDate(s.startTime),
    task: s.task.title,
    category: s.task.category,
    status: s.task.status,
    start: isoLocal(s.startTime),
    end: isoLocal(s.endTime),
    durationMinutes: Math.round((s.duration / 60_000) * 100) / 100,
    running: s.live,
    notes: s.task.notes,
  }));
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows) {
  const headers = ['date', 'task', 'category', 'status', 'start', 'end', 'durationMinutes', 'running', 'notes'];
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(','));
  return lines.join('\r\n');
}

export function toJSON(rows, dayTs) {
  const totalMinutes = Math.round(rows.reduce((sum, r) => sum + r.durationMinutes, 0) * 100) / 100;
  return JSON.stringify({ date: isoDate(dayTs), exportedAt: new Date().toISOString(), totalMinutes, sessions: rows }, null, 2);
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDay(tasks, dayTs, format, now = Date.now()) {
  const rows = dayLogRows(tasks, dayTs, now);
  const stamp = isoDate(dayTs);
  if (format === 'csv') {
    // BOM so Excel opens UTF-8 correctly.
    downloadFile(`balisoft-timelog-${stamp}.csv`, '﻿' + toCSV(rows), 'text/csv;charset=utf-8');
  } else {
    downloadFile(`balisoft-timelog-${stamp}.json`, toJSON(rows, dayTs), 'application/json');
  }
  return rows.length;
}
