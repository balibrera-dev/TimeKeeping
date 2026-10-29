import { useEffect, useId, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { inputClass } from './ui.jsx';
import { jiraIssueUrl, parseIssueKey } from '../utils/jira.js';

/** One issue key as a chip; a link that opens Jira when the domain is set. */
export function JiraChip({ label, issueKey, domain, className = '' }) {
  const url = jiraIssueUrl(domain, issueKey);
  const base = `inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset ${className}`;
  const text = (
    <>
      {label && <span className="font-sans font-normal text-slate-500 dark:text-slate-400">{label}</span>}
      <span className="truncate">{issueKey}</span>
    </>
  );
  if (!url) {
    return (
      <span className={`${base} text-slate-600 ring-slate-200 dark:text-slate-300 dark:ring-slate-700`} title="Add your Jira domain in Settings to open this issue">
        {text}
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} text-sky-700 ring-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:ring-sky-900 dark:hover:bg-sky-950/50`}
      title={`Open ${issueKey} in Jira`}
    >
      {text}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

/** Hint shown when no Jira domain is set yet. */
export function JiraDomainHint({ onOpenSettings }) {
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400">
      To open issues from here,{' '}
      {onOpenSettings ? (
        <button type="button" onClick={onOpenSettings} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          add your Jira domain in Settings
        </button>
      ) : (
        'add your Jira domain in Settings'
      )}
      .
    </p>
  );
}

/**
 * Jira key input with an Open button. Accepts a key (any case) or a pasted
 * issue link and saves the bare key on Enter or when leaving the field.
 */
export function JiraKeyInput({ label = 'Jira', value, domain, onSave, compact = false }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const url = jiraIssueUrl(domain, value);

  const commit = () => {
    const key = parseIssueKey(draft);
    if (draft.trim() && !key) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(key);
    if (key !== value) onSave(key);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className={`shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400 ${compact ? 'sr-only' : 'w-12'}`} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className={`${inputClass} min-w-0 py-1.5 font-mono uppercase placeholder:font-sans placeholder:normal-case ${invalid ? 'ring-rose-500 focus:ring-rose-500' : ''}`}
          placeholder="e.g. CLA-30533 (optional)"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(false);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
        />
        <a
          href={url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!url}
          onClick={(e) => !url && e.preventDefault()}
          className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-xs font-medium ring-1 ring-inset ${
            url
              ? 'text-sky-700 ring-sky-200 hover:bg-sky-50 dark:text-sky-300 dark:ring-sky-900 dark:hover:bg-sky-950/50'
              : 'cursor-not-allowed text-slate-400 ring-slate-200 dark:ring-slate-800'
          }`}
          title={url ? `Open ${value} in Jira` : value ? 'Add your Jira domain in Settings first' : 'Type an issue key first'}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Open
        </a>
      </div>
      {invalid && <p className={`mt-1 text-xs text-rose-600 dark:text-rose-400 ${compact ? '' : 'pl-14'}`}>Use an issue key like CLA-30533, or paste the issue link.</p>}
    </div>
  );
}
