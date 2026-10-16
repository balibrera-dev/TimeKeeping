let ctx = null;

function context() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx ??= new AudioCtx();
  return ctx;
}

/**
 * Browsers only allow sound after the user has interacted with the page, so
 * the audio context is resumed on the first click or key press. After that the
 * ping also plays while the tab is in the background.
 */
export function unlockAudio() {
  const c = context();
  if (c?.state === 'suspended') c.resume().catch(() => {});
}

/** A short two-tone ping, generated with Web Audio (no sound file needed). */
export function playPing() {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const t = c.currentTime;
  [
    [0, 880],
    [0.22, 1320],
  ].forEach(([delay, freq]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t + delay);
    gain.gain.exponentialRampToValueAtTime(0.35, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.6);
    osc.connect(gain).connect(c.destination);
    osc.start(t + delay);
    osc.stop(t + delay + 0.65);
  });
}
