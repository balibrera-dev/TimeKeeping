import { Cookie, X } from 'lucide-react';
import { legalHref } from '../hooks/useLegalRoute.js';
import { Button } from './ui.jsx';

/**
 * Cookie banner shown before any ad script loads. "Accept" and "Essential
 * only" are equally prominent, as EU guidance on consent expects.
 */
export function ConsentBanner({ open, status, onAccept, onReject, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4" role="region" aria-label="Cookie choices">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
        <Cookie className="hidden h-6 w-6 shrink-0 text-emerald-600 sm:block dark:text-emerald-400" aria-hidden="true" />
        <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">
          This free app is supported by ads. With your OK, Google and its partners use cookies to show and measure ads, including personalized
          ones. Your tasks and time logs are never shared.{' '}
          <a href={legalHref('cookies')} className="font-medium text-emerald-700 underline underline-offset-2 dark:text-emerald-400">
            Cookie &amp; Ads Policy
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={onReject}>
            Essential only
          </Button>
          <Button variant="primary" onClick={onAccept}>
            Accept
          </Button>
          {status !== null && <Button variant="ghost" size="icon" icon={X} onClick={onClose} aria-label="Keep my current choice" />}
        </div>
      </div>
    </div>
  );
}
