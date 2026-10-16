export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** 3725000 -> "01:02:05" */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/** 3725000 -> "1h 2m", 45000 -> "0m" */
export function formatDuration(ms) {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 90 -> "1h 30m" */
export function formatMinutes(min) {
  return formatDuration((Number(min) || 0) * MINUTE);
}

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts, n) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** Monday-based week start. */
export function startOfWeek(ts) {
  const d = new Date(startOfDay(ts));
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

export function isSameDay(a, b) {
  return startOfDay(a) === startOfDay(b);
}

export function formatTimeOfDay(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateLong(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Local YYYY-MM-DD, used in export filenames. */
export function isoDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local "YYYY-MM-DD HH:mm:ss", spreadsheet friendly. */
export function isoLocal(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${isoDate(ts)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Parse a typed duration into ms. Accepts "1:30", "1:30:15", "90" (minutes),
 * "1.5h", "1h 30m", "45m", "2h". Returns null when it can't be read.
 */
export function parseDuration(input) {
  const s = String(input ?? '').trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (m) return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0)) * 1000;
  if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s) * MINUTE);
  m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?$/);
  if (m && (m[1] || m[2])) return Math.round(Number(m[1] ?? 0) * HOUR + Number(m[2] ?? 0) * MINUTE);
  return null;
}
