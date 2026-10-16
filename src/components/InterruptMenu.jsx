import { useEffect, useRef, useState } from 'react';
import { Coffee, Hourglass, Phone, UtensilsCrossed } from 'lucide-react';
import { Button, ClientSelect, inputClass } from './ui.jsx';
import { INTERRUPTIONS } from '../types/index.js';

const ICONS = { call: Phone, break: Coffee, lunch: UtensilsCrossed, idle: Hourglass };

/**
 * Call / Break / Lunch / Idle. One click stops the current work and starts tracking
 * the interruption; the interrupted task is resumed when it ends. A call asks
 * for a name (and optional client) first; the others start immediately. Idle
 * time is tracked but not counted in totals.
 */
export function InterruptMenu({ clients, onStart, activeInterruptType }) {
  const [askingCall, setAskingCall] = useState(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!askingCall) return;
    setName('');
    setClientId(null);
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setAskingCall(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [askingCall]);

  const startCall = (e) => {
    e.preventDefault();
    onStart('call', name.trim() || 'Call', clientId);
    setAskingCall(false);
  };

  return (
    <div className="relative flex items-center gap-1" ref={rootRef}>
      {Object.entries(INTERRUPTIONS).map(([type, meta]) => {
        const Icon = ICONS[type];
        const current = activeInterruptType === type;
        return (
          <button
            key={type}
            type="button"
            disabled={current}
            onClick={() => (type === 'call' ? setAskingCall(!askingCall) : onStart(type, meta.label, null))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-white disabled:cursor-default disabled:opacity-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            title={
              type === 'call'
                ? 'Start a call: pauses current work and tracks the call'
                : `Start ${meta.label.toLowerCase()}: pauses current work${meta.counts ? '' : ' (not counted in totals)'}`
            }
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} aria-hidden="true" />
            <span className="hidden lg:inline">{meta.label}</span>
          </button>
        );
      })}

      {askingCall && (
        <form
          onSubmit={startCall}
          className="absolute right-0 top-full z-40 mt-2 w-[min(92vw,20rem)] space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="h-4 w-4" style={{ color: INTERRUPTIONS.call.color }} aria-hidden="true" /> Start a call
          </div>
          <input
            autoFocus
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAskingCall(false)}
            placeholder={INTERRUPTIONS.call.placeholder}
          />
          {clients.length > 0 && <ClientSelect clients={clients} value={clientId} onChange={setClientId} />}
          <p className="text-xs text-slate-500 dark:text-slate-400">The running task pauses now and resumes when you end the call.</p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setAskingCall(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" icon={Phone}>
              Start call
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
