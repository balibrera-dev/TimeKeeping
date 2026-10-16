import { LEGAL } from '../config.js';
import { LEGAL_DOCS } from '../legal/documents.jsx';
import { legalHref } from '../hooks/useLegalRoute.js';

const linkClass = 'hover:text-slate-900 hover:underline dark:hover:text-white';

/** Site footer: legal links and the "Privacy choices" entry point for ad consent. */
export function Footer({ showChoices, onOpenChoices }) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
        <p>
          © {new Date().getFullYear()} {LEGAL.operator}. Your data stays in this browser.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
          {LEGAL_DOCS.map((d) => (
            <a key={d.id} href={legalHref(d.id)} className={linkClass}>
              {d.short}
            </a>
          ))}
          {showChoices && (
            <button type="button" onClick={onOpenChoices} className={linkClass}>
              Privacy choices
            </button>
          )}
        </nav>
      </div>
    </footer>
  );
}
