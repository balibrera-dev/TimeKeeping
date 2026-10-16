import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button, Field, Modal, inputClass } from './ui.jsx';
import { AI_MODELS, loadAiSettings, saveAiSettings } from '../utils/ai.js';
import { AI_ENABLED } from '../config.js';
import { DEFAULT_SETTINGS } from '../utils/reducer.js';

/**
 * App settings. General preferences live in the tracker state; the AI key
 * (only when AI is enabled) stays under its own localStorage key.
 */
export function SettingsModal({ open, onClose, settings: appSettings, onSave }) {
  const [prefs, setPrefs] = useState({ ...DEFAULT_SETTINGS, ...appSettings });
  const [ai, setAi] = useState(loadAiSettings);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setPrefs({ ...DEFAULT_SETTINGS, ...appSettings });
      setAi(loadAiSettings());
      setShow(false);
    }
  }, [open, appSettings]);

  const save = () => {
    onSave(prefs);
    if (AI_ENABLED) saveAiSettings({ ...ai, apiKey: ai.apiKey.trim() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Check} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={prefs.allowTimeEdits}
            onChange={(e) => setPrefs((p) => ({ ...p, allowTimeEdits: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
          />
          <span>
            <span className="block text-sm font-medium">Allow editing time on completed subtasks</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Click the time of a checked-off subtask to type its real total. The task total updates; the calendar keeps the tracked sessions. Turn
              this off to lock times to what the timer recorded.
            </span>
          </span>
        </label>

        {AI_ENABLED && (
          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <div className="flex items-start gap-2 rounded-lg bg-violet-50 p-3 text-sm text-violet-900 dark:bg-violet-500/10 dark:text-violet-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                “Improve with AI” rewrites a comment with Claude to make it clearer. It needs an Anthropic API key from{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="font-medium underline">
                  console.anthropic.com
                </a>
                . The key is stored only in this browser and is sent only to the Anthropic API when you click Improve.
              </p>
            </div>
            <Field label="Anthropic API key">
              <div className="flex gap-2">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  className={`${inputClass} font-mono`}
                  value={ai.apiKey}
                  onChange={(e) => setAi((s) => ({ ...s, apiKey: e.target.value }))}
                  placeholder="sk-ant-…"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  icon={show ? EyeOff : Eye}
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide key' : 'Show key'}
                  className="h-auto"
                />
              </div>
            </Field>
            <Field label="Model">
              <select className={inputClass} value={ai.model} onChange={(e) => setAi((s) => ({ ...s, model: e.target.value }))}>
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
