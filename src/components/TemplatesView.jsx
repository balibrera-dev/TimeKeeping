import { useState } from 'react';
import { Copy, LayoutTemplate, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, Field, Modal, inputClass } from './ui.jsx';
import { SubtaskEditor, cleanSubtasks } from './SubtaskEditor.jsx';
import { CATEGORIES } from '../types/index.js';
import { formatMinutes } from '../utils/time.js';
import { uid } from '../utils/id.js';

export function TemplatesView({ templates, actions }) {
  const [editing, setEditing] = useState(null); // template draft or null
  const [confirmDelete, setConfirmDelete] = useState(null);

  const startNew = () => setEditing({ id: null, title: '', category: 'Development', subtasks: [{ id: uid(), title: '', estimate: 30 }] });
  const duplicate = (t) =>
    setEditing({ ...t, id: null, title: `${t.title} (copy)`, subtasks: t.subtasks.map((s) => ({ ...s, id: uid() })) });

  const useTemplate = (t) =>
    actions.createTask({ title: t.title, category: t.category, templateId: t.id, subtasks: t.subtasks, startNow: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Reusable blueprints with subtasks and default estimates.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={startNew}>
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          action={
            <Button variant="primary" icon={Plus} onClick={startNew}>
              Create a template
            </Button>
          }
        >
          Templates hold the checklist you repeat for each kind of work, like Get data → Implement data → Create measures → Create report → Get
          approval.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const total = t.subtasks.reduce((sum, s) => sum + (Number(s.estimate) || 0), 0);
            return (
              <Card key={t.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{t.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.category} · {t.subtasks.length} subtasks · {formatMinutes(total)}
                    </p>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" icon={Pencil} onClick={() => setEditing(t)} aria-label="Edit template" title="Edit" />
                    <Button variant="ghost" size="icon" icon={Copy} onClick={() => duplicate(t)} aria-label="Duplicate template" title="Duplicate" />
                    <Button
                      variant="danger"
                      size="icon"
                      icon={Trash2}
                      onClick={() => setConfirmDelete(t)}
                      aria-label="Delete template"
                      title="Delete"
                    />
                  </div>
                </div>
                <ol className="mt-3 flex-1 space-y-1 text-sm">
                  {t.subtasks.map((s, i) => (
                    <li key={s.id} className="flex justify-between gap-2 text-slate-600 dark:text-slate-300">
                      <span className="truncate">
                        <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                        {s.title}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{formatMinutes(s.estimate)}</span>
                    </li>
                  ))}
                  {t.subtasks.length === 0 && <li className="text-slate-400">No subtasks</li>}
                </ol>
                <Button variant="secondary" size="sm" icon={Play} className="mt-4 self-start" onClick={() => useTemplate(t)}>
                  Create task &amp; start
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <TemplateEditor
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={(tpl) => {
          actions.saveTemplate(tpl);
          setEditing(null);
        }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete template?"
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="dangerSolid"
              icon={Trash2}
              onClick={() => {
                actions.deleteTemplate(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          “{confirmDelete?.title}” will be removed. Tasks already created from it keep their checklist and time logs.
        </p>
      </Modal>
    </div>
  );
}

function TemplateEditor({ draft, onClose, onSave }) {
  const [form, setForm] = useState(draft);
  const [lastDraft, setLastDraft] = useState(draft);
  if (draft !== lastDraft) {
    setLastDraft(draft);
    setForm(draft);
  }
  if (!form) return null;

  const valid = form.title.trim().length > 0;
  const save = () => {
    if (!valid) return;
    onSave({ ...form, id: form.id ?? uid(), title: form.title.trim(), subtasks: cleanSubtasks(form.subtasks) });
  };

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={draft?.id ? 'Edit template' : 'New template'}
      wide
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Save template
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Field label="Template name">
            <input
              autoFocus
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Add Visual to Existing Report"
            />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {[...new Set([...CATEGORIES, form.category])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <SubtaskEditor subtasks={form.subtasks} onChange={(subtasks) => setForm({ ...form, subtasks })} />
      </div>
    </Modal>
  );
}
