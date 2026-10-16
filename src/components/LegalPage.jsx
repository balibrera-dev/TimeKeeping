import { ArrowLeft, Scale } from 'lucide-react';
import { LEGAL } from '../config.js';
import { LEGAL_DOCS } from '../legal/documents.jsx';
import { legalHref } from '../hooks/useLegalRoute.js';
import { Card } from './ui.jsx';

/** One legal document, with tabs to the others and a way back to the app. */
export function LegalPage({ docId, onBack }) {
  const doc = LEGAL_DOCS.find((d) => d.id === docId) ?? LEGAL_DOCS[0];
  const { Body } = doc;
  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to the app
      </button>

      <nav className="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900" aria-label="Legal documents">
        {LEGAL_DOCS.map((d) => (
          <a
            key={d.id}
            href={legalHref(d.id)}
            aria-current={d.id === doc.id ? 'page' : undefined}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              d.id === doc.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {d.short}
          </a>
        ))}
      </nav>

      <Card className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <Scale className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Last updated {LEGAL.effectiveDate}</p>
          </div>
        </div>
        <div className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <Body />
        </div>
      </Card>
    </div>
  );
}
