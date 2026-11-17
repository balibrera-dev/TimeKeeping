import { useEffect } from 'react';

/** The client color of the running task, or null when no timer runs or the task has no client. */
export function runningClientColor(activeTask, clients) {
  if (!activeTask?.clientId) return null;
  const color = clients?.find((c) => c.id === activeTask.clientId)?.color;
  return /^#[0-9a-f]{3,8}$/i.test(color ?? '') ? color : null;
}

/**
 * While a timer runs on a client's task, the app's accent (the emerald
 * scale) takes that client's hue. index.css rebuilds the scale from
 * --client-accent with emerald's own lightness steps, so contrast stays
 * the same in light and dark. With no client running, emerald comes back.
 */
export function useClientAccent(activeTask, clients) {
  const color = runningClientColor(activeTask, clients);
  useEffect(() => {
    const root = document.documentElement;
    if (color) {
      root.style.setProperty('--client-accent', color);
      root.dataset.clientAccent = '';
    } else {
      root.style.removeProperty('--client-accent');
      delete root.dataset.clientAccent;
    }
  }, [color]);
  return color;
}
