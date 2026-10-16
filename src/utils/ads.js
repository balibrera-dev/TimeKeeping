/** Loads the Google AdSense script once. Safe to call repeatedly. */
export function loadAdSense(client) {
  if (typeof document === 'undefined' || !client) return;
  if (document.querySelector('script[data-balisoft-adsense]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  script.dataset.balisoftAdsense = 'true';
  document.head.appendChild(script);
}

/**
 * Re-opens Google's consent message so a visitor can change their choice
 * (only works when AdSense "Privacy & messaging" is in use).
 */
export function showGoogleConsentMessage() {
  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push(() => window.googlefc.showRevocationMessage?.());
}
