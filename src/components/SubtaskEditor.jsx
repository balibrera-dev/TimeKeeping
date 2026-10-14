import { Plus, Trash2 } from 'lucide-react';
import { Button, inputClass } from './ui.jsx';
import { formatMinutes } from '../utils/time.js';
import { uid } from '../utils/id.js';

/** Editable list of { id, title, estimate } rows, used by templates and new tasks. */
export function SubtaskEditor({ subtasks, onChange }) {
  const update = (id, patch) => onChange(subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => onChange(subtasks.filter((s) => s.id !== id));
  const add = () => onChange([...subtasks, { id: uid(), title: '', estimate: 30 }]);
  const total = subtasks.reduce((sum, s) => sum + (Number(s.estimate) || 0), 0);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Subtasks</span>
        <span className="text-xs text-slate-500">Total estimate: {formatMinutes(total)}</span>
      </div>
      <div className="space-y-2">
        {subtasks.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <span className="w-5 text-right text-xs text-slate-400">{i + 1}.</span>
            <input
              className={inputClass}
              value={s.title}
              placeholder="e.g. Get data"
              onChange={(e) => update(s.id, { title: e.target.value })}
            />
            <div className="relative w-28 shrink-0">
              <input
                type="number"
                min="0"
                step="5"
                className={`${inputClass} pr-10`}
                value={s.estimate}
                onChange={(e) => update(s.id, { estimate: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) })}
                aria-label="Estimate in minutes"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">min</span>
            </div>
            <Button variant="danger" size="icon" icon={Trash2} onClick={() => remove(s.id)} aria-label="Remove subtask" />
          </div>
        ))}
        {subtasks.length === 0 && <p className="text-xs text-slate-400">No subtasks yet.</p>}
      </div>
      <Button variant="ghost" size="sm" icon={Plus} className="mt-2" onClick={add}>
        Add subtask
      </Button>
    </div>
  );
}

/** Drop empty rows and coerce estimates before saving. */
export function cleanSubtasks(subtasks) {
  return subtasks
    .filter((s) => s.title.trim())
    .map((s) => ({ ...s, title: s.title.trim(), estimate: Number(s.estimate) || 0 }));
}
