import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button, Field, Modal, inputClass } from './ui.jsx';
import { AI_MODELS, loadAiSettings, saveAiSettings } from '../utils/ai.js';

/** AI settings for "Improve with AI". The key stays in this browser only. */
export function SettingsModal({ open, onClose }) {
  const [settings, setSettings] = useState(loadAiSettings);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(loadAiSettings());
      setShow(false);
    }
  }, [open]);

  const save = () => {
    saveAiSettings({ ...settings, apiKey: settings.apiKey.trim() });
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
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
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
              value={settings.apiKey}
              onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
              placeholder="sk-ant-…"
            />
            <Button variant="ghost" size="icon" icon={show ? EyeOff : Eye} onClick={() => setShow(!show)} aria-label={show ? 'Hide key' : 'Show key'} className="h-auto" />
          </div>
        </Field>
        <Field label="Model">
          <select className={inputClass} value={settings.model} onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}>
            {AI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
