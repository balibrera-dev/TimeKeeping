import { useEffect } from 'react';
import { X } from 'lucide-react';

const BUTTON_VARIANTS = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-500',
  amber: 'bg-amber-500 text-white hover:bg-amber-400 focus-visible:ring-amber-500',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50',
  dangerSolid: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500',
  brand: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  icon: 'h-8 w-8 justify-center',
};

export function Button({ variant = 'secondary', size = 'md', className = '', icon: Icon, children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' || size === 'icon' ? 'h-4 w-4' : 'h-4 w-4'} aria-hidden="true" />}
      {children}
    </button>
  );
}

export const STATUS_STYLES = {
  active: {
    label: 'Active',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
  },
  paused: {
    label: 'Paused',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/30',
    dot: 'bg-slate-400',
    border: 'border-l-slate-400',
  },
  idle: {
    label: 'Not started',
    badge: 'bg-white text-slate-500 ring-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700',
    dot: 'bg-slate-300 dark:bg-slate-600',
    border: 'border-l-slate-200 dark:border-l-slate-700',
  },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      {Icon && (
        <div className="mb-3 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
          <Icon className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** value / max as a bar; turns amber past 100% to flag overruns. */
export function ProgressBar({ value, max, className = '' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const over = pct > 100;
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${over ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" icon={X} onClick={onClose} aria-label="Close" />
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  );
}

export const inputClass =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700';

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/** Stable color per category for calendar blocks and charts. */
const CATEGORY_COLORS = [
  { block: 'bg-sky-100 border-sky-500 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100', bar: 'bg-sky-500' },
  { block: 'bg-violet-100 border-violet-500 text-violet-900 dark:bg-violet-500/20 dark:text-violet-100', bar: 'bg-violet-500' },
  { block: 'bg-teal-100 border-teal-500 text-teal-900 dark:bg-teal-500/20 dark:text-teal-100', bar: 'bg-teal-500' },
  { block: 'bg-indigo-100 border-indigo-500 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-100', bar: 'bg-indigo-500' },
  { block: 'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100', bar: 'bg-rose-500' },
  { block: 'bg-cyan-100 border-cyan-500 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-100', bar: 'bg-cyan-500' },
  { block: 'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900 dark:bg-fuchsia-500/20 dark:text-fuchsia-100', bar: 'bg-fuchsia-500' },
];

export function categoryColor(category = '') {
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}
