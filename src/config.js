/**
 * Build-time feature flags. Set them in a `.env.local` file (see .env.example)
 * and restart `npm run dev` / rebuild for a change to take effect.
 */

/** "Improve with AI" on comments. Off by default; set VITE_ENABLE_AI=true to show it. */
export const AI_ENABLED = import.meta.env?.VITE_ENABLE_AI === 'true';

/**
 * Google AdSense. Ads stay off until both IDs are set, e.g.
 * VITE_ADSENSE_CLIENT=ca-pub-1234567890123456 and VITE_ADSENSE_SLOT=1234567890.
 */
export const ADSENSE_CLIENT = (import.meta.env?.VITE_ADSENSE_CLIENT ?? '').trim();
export const ADSENSE_SLOT = (import.meta.env?.VITE_ADSENSE_SLOT ?? '').trim();
export const ADS_ENABLED = /^ca-pub-\d+$/.test(ADSENSE_CLIENT) && /^\d+$/.test(ADSENSE_SLOT);

/**
 * Who asks visitors for ad consent:
 * - "builtin" (default): this app's own cookie banner. Ads load only after "Accept".
 * - "google": AdSense's certified "Privacy & messaging" consent messages, which
 *   Google requires for personalized ads in the EEA, UK and Switzerland. The
 *   app's banner is then hidden and Google shows its own message.
 */
export const ADS_CONSENT_MODE = import.meta.env?.VITE_ADS_CONSENT_MODE === 'google' ? 'google' : 'builtin';

/** Details shown in the legal pages. */
export const LEGAL = {
  operator: (import.meta.env?.VITE_LEGAL_OPERATOR ?? '').trim() || 'BALISOFT',
  contactEmail: (import.meta.env?.VITE_LEGAL_CONTACT_EMAIL ?? '').trim(),
  contactUrl: 'https://github.com/balibrera-dev',
  governingLaw: (import.meta.env?.VITE_LEGAL_GOVERNING_LAW ?? '').trim(),
  effectiveDate: 'October 16, 2026',
};
