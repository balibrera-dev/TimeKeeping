import { initialState, sanitizeState } from './reducer.js';

export const STORAGE_KEY = 'balisoft-timekeeping:v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = sanitizeState(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('Could not read saved data, starting fresh.', err);
  }
  return initialState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Could not save to localStorage.', err);
    return false;
  }
}
