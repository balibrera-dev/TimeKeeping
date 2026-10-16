import { useEffect, useState } from 'react';
import { BellRing, Check, Eye, EyeOff, Sparkles, Volume2 } from 'lucide-react';
import { Button, Field, Modal, inputClass } from './ui.jsx';
import { AI_MODELS, loadAiSettings, saveAiSettings } from '../utils/ai.js';
import { AI_ENABLED } from '../config.js';
import { DEFAULT_SETTINGS } from '../utils/reducer.js';
import { notificationStatus, playPing, requestNotificationPermission } from '../utils/alerts.js';

const NOTIFY_HELP = {
  unsupported: 'This browser does not support notifications.',
  insecure: 'Not available on this address (needs localhost or https). Use the PC link or the Vercel link for notifications.',
  denied: 'Blocked for this site. Allow notifications in the browser’s site settings (lock icon in the address bar).',
  default: 'The browser will ask for permission when you turn this on.',
  granted: 'Shown when the app is in the background or minimized.',
};

/**
 * App settings. General preferences live in the tracker state; the AI key
 * (only when AI is enabled) stays under its own localStorage key.
 */
export function SettingsModal({ open, onClose, settings: appSettings, onSave }) {
  const [prefs, setPrefs] = useState({ ...DEFAULT_SETTINGS, ...appSettings });
  const [ai, setAi] = useState(loadAiSettings);
  const [show, setShow] = useState(false);
  const [notify, setNotify] = useState(notificationStatus);

  useEffect(() => {
    if (open) {
      setPrefs({ ...DEFAULT_SETTINGS, ...appSettings });
      setAi(loadAiSettings());
      setShow(false);
      setNotify(notificationStatus());
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

        <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={prefs.estimateAlerts}
              onChange={(e) => setPrefs((p) => ({ ...p, estimateAlerts: e.target.checked }))}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-emerald-600"
            />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <BellRing className="h-4 w-4 text-amber-500" aria-hidden="true" /> Alert when a subtask nears its estimate
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Pings when the subtask the timer is on (or a task without subtasks) is about to use up its estimate, and asks whether to stay or move on.
              </span>
            </span>
          </label>

          {prefs.estimateAlerts && (
            <div className="space-y-3 pl-7">
              <label className="flex items-center gap-2 text-sm">
                Warn
                <input
                  type="number"
                  min="0"
                  max="60"
                  className={`${inputClass} w-16 py-1`}
                  value={prefs.alertLeadMinutes}
                  onChange={(e) => setPrefs((p) => ({ ...p, alertLeadMinutes: Math.max(0, Math.min(60, Number(e.target.value) || 0)) }))}
                />
                minute(s) before the estimate <span className="text-xs text-slate-400">(0 = when it’s reached)</span>
              </label>

              <fieldset className="space-y-1.5">
                <legend className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">When the estimate is reached</legend>
                {[
                  ['stay', 'Stay on the subtask and ask me (default)'],
                  ['next', 'Move to the next subtask automatically'],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="onEstimateReached"
                      value={value}
                      checked={prefs.onEstimateReached === value}
                      onChange={() => setPrefs((p) => ({ ...p, onEstimateReached: value }))}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.alertSound}
                    onChange={(e) => setPrefs((p) => ({ ...p, alertSound: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  />
                  Play a sound
                </label>
                <Button size="sm" variant="ghost" icon={Volume2} onClick={playPing}>
                  Test sound
                </Button>
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prefs.desktopNotifications && notify === 'granted'}
                    disabled={notify === 'unsupported' || notify === 'insecure' || notify === 'denied'}
                    onChange={async (e) => {
                      const on = e.target.checked;
                      const status = on ? await requestNotificationPermission() : notify;
                      setNotify(status);
                      setPrefs((p) => ({ ...p, desktopNotifications: on && status === 'granted' }));
                    }}
                    className="h-4 w-4 rounded border-slate-300 accent-emerald-600 disabled:opacity-50"
                  />
                  Windows / desktop notifications
                </label>
                <p className="mt-0.5 pl-6 text-xs text-slate-500 dark:text-slate-400">{NOTIFY_HELP[notify]}</p>
              </div>
            </div>
          )}
        </div>

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
