/**
 * Build-time feature flags. Set them in a `.env.local` file (see .env.example)
 * and restart `npm run dev` / rebuild for a change to take effect.
 */

/** "Improve with AI" on comments. Off by default; set VITE_ENABLE_AI=true to show it. */
export const AI_ENABLED = import.meta.env?.VITE_ENABLE_AI === 'true';
