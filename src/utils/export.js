import { DAY, isoDate, isoLocal, startOfDay } from './time.js';
import { countsTowardTotal, sessionsInRange, subtaskTitle } from './sessions.js';

/** Flat rows for one day's sessions (open session clipped at `now`). */
export function dayLogRows(tasks, dayTs, now, clients = []) {
  const start = startOfDay(dayTs);
  const clientName = (id) => clients.find((c) => c.id === id)?.name ?? '';
  return sessionsInRange(tasks, start, start + DAY, now).map((s) => {
    const subtask = s.task.subtasks.find((st) => st.id === s.subtaskId);
    return {
      date: isoDate(s.startTime),
      client: clientName(s.task.clientId),
      task: s.task.title,
      subtask: subtaskTitle(s.task, s.subtaskId),
      type: s.task.kind === 'interruption' ? s.task.interruptType : 'task',
      category: s.task.category,
      status: s.task.status,
      start: isoLocal(s.startTime),
      end: isoLocal(s.endTime),
      durationMinutes: Math.round((s.duration / 60_000) * 100) / 100,
      running: s.live,
      counted: countsTowardTotal(s.task),
      comment: subtask ? subtask.notes : s.task.notes,
    };
  });
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows) {
  const headers = ['date', 'client', 'task', 'subtask', 'type', 'category', 'status', 'start', 'end', 'durationMinutes', 'running', 'counted', 'comment'];
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(','));
  return lines.join('\r\n');
}

export function toJSON(rows, dayTs) {
  const sum = (list) => Math.round(list.reduce((acc, r) => acc + r.durationMinutes, 0) * 100) / 100;
  // Idle sessions are listed but left out of the total.
  const totalMinutes = sum(rows.filter((r) => r.counted !== false));
  const idleMinutes = sum(rows.filter((r) => r.counted === false));
  return JSON.stringify({ date: isoDate(dayTs), exportedAt: new Date().toISOString(), totalMinutes, idleMinutes, sessions: rows }, null, 2);
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

export function exportDay(tasks, dayTs, format, now = Date.now(), clients = []) {
  const rows = dayLogRows(tasks, dayTs, now, clients);
  const stamp = isoDate(dayTs);
  if (format === 'csv') {
    // BOM so Excel opens UTF-8 correctly.
    downloadFile(`balisoft-timelog-${stamp}.csv`, '﻿' + toCSV(rows), 'text/csv;charset=utf-8');
  } else {
    downloadFile(`balisoft-timelog-${stamp}.json`, toJSON(rows, dayTs), 'application/json');
  }
  return rows.length;
}
