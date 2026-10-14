import { useEffect, useState } from 'react';

/**
 * Current timestamp, refreshed every `intervalMs`. The interval only triggers
 * re-renders; elapsed time is always computed from Date.now() deltas, so a
 * throttled background tab never drifts. Also refreshes immediately when the
 * tab becomes visible again.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);
  return now;
}
