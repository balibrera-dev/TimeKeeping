/**
 * Desktop notifications (Windows / macOS notification center) from the
 * browser. They need a secure origin: localhost and https work, a plain
 * http://192.168.x.x address (phone on Wi-Fi) does not.
 * @returns {'unsupported' | 'insecure' | 'default' | 'granted' | 'denied'}
 */
export function notifyStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return Notification.permission;
}

/** Ask for permission (must be called from a click). Resolves to the new status. */
export async function requestNotify() {
  const status = notifyStatus();
  if (status !== 'default') return status;
  try {
    await Notification.requestPermission();
  } catch {
    /* older browsers throw instead of returning a promise */
  }
  return notifyStatus();
}

/** Show a notification; clicking it brings the app's tab to the front. */
export function showNotification(title, body, tag) {
  if (notifyStatus() !== 'granted') return null;
  try {
    const n = new Notification(title, { body, tag, renotify: true, requireInteraction: true });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return n;
  } catch {
    return null;
  }
}
