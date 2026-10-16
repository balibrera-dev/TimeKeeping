import { useEffect, useState } from 'react';
import { BellRing, Check, Eye, EyeOff, Sparkles, Volume2 } from 'lucide-react';
import { Button, Field, Modal, inputClass } from './ui.jsx';
import { AI_MODELS, loadAiSettings, saveAiSettings } from '../utils/ai.js';
import { AI_ENABLED } from '../config.js';
import { DEFAULT_SETTINGS } from '../utils/reducer.js';
import { playPing, unlockAudio } from '../utils/sound.js';
import { notifyStatus, requestNotify, showNotification } from '../utils/notify.js';

const NOTIFY_HELP = {
  unsupported: 'This browser does not support desktop notifications.',
  insecure: 'Notifications only work on localhost or https. Open the app on localhost or Vercel to use them (not on the Wi-Fi address).',
  denied: 'Notifications are blocked for this site. Allow them in the browser’s site settings (lock icon in the address bar), then try again.',
};

/**
 * App settings. General preferences live in the tracker state; the AI key
 * (only when AI is enabled) stays under its own localStorage key.
 */
export function SettingsModal({ open, onClose, settings: appSettings, onSave }) {
  const [prefs, setPrefs] = useState({ ...DEFAULT_SETTINGS, ...appSettings });
  const [ai, setAi] = useState(loadAiSettings);
  const [show, setShow] = useState(false);
  const [notify, setNotify] = useState(notifyStatus);

  useEffect(() => {
    if (open) {
      setPrefs({ ...DEFAULT_SETTINGS, ...appSettings });
      setAi(loadAiSettings());
      setShow(false);
      setNotify(notifyStatus());
    }
  }, [open, appSettings]);

  const toggleNotify = async (on) => {
    if (!on) return setPrefs((p) => ({ ...p, alertNotify: false }));
    const status = await requestNotify();
    setNotify(status);
    setPrefs((p) => ({ ...p, alertNotify: status === 'granted' }));
    if (status === 'granted') showNotification('Notifications are on', 'You’ll get a heads-up here when a subtask is about to reach its estimate.', 'test');
  };

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

        <fieldset className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <legend className="mb-1 text-sm font-semibold">Estimate alerts</legend>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            When the running subtask (or a task with no subtask selected) is about to reach its estimate, you get a prompt to stay on it, move to the
            next subtask, or pause.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0">Alert</span>
            <span className="w-20 shrink-0">
              <input
                type="number"
                min="0"
                max="60"
                className={inputClass}
                value={prefs.alertLeadMinutes}
                onChange={(e) => setPrefs((p) => ({ ...p, alertLeadMinutes: Math.max(0, Math.min(60, Number(e.target.value) || 0)) }))}
              />
            </span>
            <span>minutes before the estimate (0 = when it’s reached)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={prefs.alertSound}
              onChange={(e) => setPrefs((p) => ({ ...p, alertSound: e.target.checked }))}
              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
            />
            <span className="flex-1 text-sm font-medium">Play a ping</span>
            <Button
              size="sm"
              variant="ghost"
              icon={Volume2}
              onClick={() => {
                unlockAudio();
                playPing();
              }}
            >
              Test
            </Button>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={prefs.alertNotify && notify === 'granted'}
              disabled={notify === 'unsupported' || notify === 'insecure'}
              onChange={(e) => toggleNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BellRing className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> Desktop notification when the app is in the background
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {NOTIFY_HELP[notify] ?? 'Shows in the Windows notification area. Clicking it brings the app back to the front.'}
              </span>
            </span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">When the estimate is reached</span>
            <select className={inputClass} value={prefs.onEstimate} onChange={(e) => setPrefs((p) => ({ ...p, onEstimate: e.target.value }))}>
              <option value="stay">Stay on the subtask (default)</option>
              <option value="next">Check it off and move to the next subtask automatically</option>
            </select>
          </label>
        </fieldset>

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
