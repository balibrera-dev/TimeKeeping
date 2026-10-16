/**
 * The visitor's advertising-cookie choice, kept in localStorage next to the
 * app data (but under its own key, so it never ends up in exports).
 */
export const CONSENT_KEY = 'balisoft-timekeeping:consent';

/** Bump when the cookie/ads policy changes in a way that needs asking again. */
export const CONSENT_VERSION = 1;

/**
 * @typedef {Object} Consent
 * @property {'granted'|'denied'} ads
 * @property {number} decidedAt   Date.now() of the choice.
 * @property {number} version
 */

/** @returns {Consent|null} the stored choice, or null when none (or an outdated one) is stored. */
export function readConsent(storage = globalThis.localStorage) {
  try {
    const parsed = JSON.parse(storage?.getItem(CONSENT_KEY) ?? 'null');
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    if (parsed.ads !== 'granted' && parsed.ads !== 'denied') return null;
    return { ads: parsed.ads, decidedAt: Number(parsed.decidedAt) || 0, version: parsed.version };
  } catch {
    return null;
  }
}

/** @returns {Consent} */
export function writeConsent(granted, storage = globalThis.localStorage, now = Date.now()) {
  const consent = { ads: granted ? 'granted' : 'denied', decidedAt: now, version: CONSENT_VERSION };
  try {
    storage?.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
  return consent;
}

/** Global Privacy Control: a browser-level "do not sell or share" signal. */
export function gpcEnabled(nav = globalThis.navigator) {
  return nav?.globalPrivacyControl === true;
}

/**
 * Whether ad cookies may be used: 'granted', 'denied', or null when the
 * visitor still has to be asked. With GPC on and no explicit choice yet, the
 * answer is 'denied' and no banner is needed.
 */
export function adsConsentStatus(consent, gpc) {
  if (consent) return consent.ads;
  return gpc ? 'denied' : null;
}
