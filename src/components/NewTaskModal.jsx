import { useEffect, useState } from 'react';
import { LayoutTemplate, Play, Plus } from 'lucide-react';
import { Button, Field, Modal, inputClass } from './ui.jsx';
import { SubtaskEditor, cleanSubtasks } from './SubtaskEditor.jsx';
import { CATEGORIES } from '../types/index.js';
import { uid } from '../utils/id.js';

export function NewTaskModal({ open, onClose, templates, onCreate, onManageTemplates }) {
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Development');
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (open) {
      setTemplateId('');
      setTitle('');
      setCategory('Development');
      setSubtasks([]);
    }
  }, [open]);

  const pickTemplate = (id) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setCategory(tpl.category);
      setSubtasks(tpl.subtasks.map((s) => ({ ...s, id: uid() })));
      if (!title.trim() || templates.some((t) => t.title === title)) setTitle(tpl.title);
    } else {
      setSubtasks([]);
    }
  };

  const submit = (startNow) => {
    if (!title.trim()) return;
    onCreate({ title, category, templateId: templateId || null, subtasks: cleanSubtasks(subtasks), startNow });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      wide
      footer={
        <>
          <Button variant="secondary" icon={Plus} onClick={() => submit(false)} disabled={!title.trim()}>
            Create
          </Button>
          <Button variant="primary" icon={Play} onClick={() => submit(true)} disabled={!title.trim()}>
            Create &amp; start
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(true);
        }}
      >
        <Field label="Start from a template">
          {templates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <TemplateChip active={!templateId} onClick={() => pickTemplate('')}>
                Blank (ad-hoc)
              </TemplateChip>
              {templates.map((t) => (
                <TemplateChip key={t.id} active={templateId === t.id} onClick={() => pickTemplate(t.id)}>
                  {t.title}
                </TemplateChip>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No templates yet.{' '}
              <button type="button" className="font-medium text-emerald-600 hover:underline" onClick={onManageTemplates}>
                Create one
              </button>{' '}
              to reuse subtask checklists.
            </p>
          )}
        </Field>

        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Field label="Task name">
            <input
              autoFocus
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sales dashboard – Q4 revenue visual"
            />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {[...new Set([...CATEGORIES, category])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <SubtaskEditor subtasks={subtasks} onChange={setSubtasks} />
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

function TemplateChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm ring-1 ring-inset transition-colors ${
        active
          ? 'bg-emerald-50 font-medium text-emerald-700 ring-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'text-slate-600 ring-slate-300 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <LayoutTemplate className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </button>
  );
}
