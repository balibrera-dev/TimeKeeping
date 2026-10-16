/**
 * Alert helpers: a synthesized ping (no audio files) and system notifications
 * through the browser's Notification API.
 */

let ctx = null;

function audioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  return ctx;
}

/**
 * Browsers only allow audio after a user gesture. Call once at startup: the
 * first click / key press anywhere unlocks the audio context for later pings.
 */
export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    audioContext()?.resume();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

/** Two short rising tones, like a soft "ding-ding". */
export function playPing() {
  const ac = audioContext();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const start = ac.currentTime + 0.02;
  [
    [880, 0],
    [1320, 0.18],
  ].forEach(([freq, offset]) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.45);
    osc.connect(gain).connect(ac.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.5);
  });
}

/**
 * 'unsupported' | 'insecure' | 'default' | 'granted' | 'denied'.
 * Notifications need a secure origin: localhost and https work; a plain
 * http://192.168.x.x address (phone on Wi-Fi) does not.
 */
export function notificationStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (notificationStatus() !== 'default') return notificationStatus();
  try {
    return await Notification.requestPermission();
  } catch {
    return notificationStatus();
  }
}

/** Show a system notification; clicking it brings the app tab to the front. */
export function showNotification(title, body, tag) {
  if (notificationStatus() !== 'granted') return;
  try {
    const n = new Notification(title, { body, tag, renotify: true });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* Some mobile browsers only allow notifications from a service worker. */
  }
}
