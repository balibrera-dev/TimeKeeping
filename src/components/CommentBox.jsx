import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Undo2 } from 'lucide-react';
import { inputClass } from './ui.jsx';
import { improveComment } from '../utils/ai.js';
import { AI_ENABLED } from '../config.js';

/**
 * A single comment with debounced autosave, a timestamp helper and an
 * "Improve with AI" button that rewrites it via Claude (undoable), shown
 * only when AI_ENABLED is on.
 */
export function CommentBox({ value: saved, onSave, context, placeholder, rows = 3, autoFocus = false }) {
  const [value, setValue] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previous, setPrevious] = useState(null); // text before the last AI rewrite

  useEffect(() => setValue(saved), [saved]);
  useEffect(() => {
    if (value === saved) return;
    const id = setTimeout(() => onSave(value), 400);
    return () => clearTimeout(id);
  }, [value, saved, onSave]);

  const stamp = () => {
    const line = `[${new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}] `;
    setValue((v) => (v && !v.endsWith('\n') ? `${v}\n${line}` : `${v}${line}`));
  };

  const improve = async () => {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const better = await improveComment({ text: value, ...context });
      setPrevious(value);
      setValue(better);
      onSave(better);
    } catch (err) {
      setError(err.message || 'AI request failed.');
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    setValue(previous);
    onSave(previous);
    setPrevious(null);
  };

  return (
    <div>
      <textarea
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        disabled={busy}
        onChange={(e) => {
          setValue(e.target.value);
          setPrevious(null);
        }}
        onBlur={() => value !== saved && onSave(value)}
        placeholder={placeholder}
        className={`${inputClass} resize-y font-mono text-xs leading-relaxed disabled:opacity-60`}
      />
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={stamp} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          + timestamp
        </button>
        {AI_ENABLED && (
        <button
          type="button"
          onClick={improve}
          disabled={busy || !value.trim()}
          className="inline-flex items-center gap-1 font-medium text-violet-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline dark:text-violet-400"
          title="Rewrite this comment to be clearer and more professional"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
          {busy ? 'Improving…' : 'Improve with AI'}
        </button>
        )}
        {previous != null && !busy && (
          <button type="button" onClick={undo} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:underline">
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Undo AI
          </button>
        )}
        {error && <span className="text-rose-600 dark:text-rose-400">{error}</span>}
      </div>
    </div>
  );
}
