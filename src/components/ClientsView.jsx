import { useMemo, useState } from 'react';
import { Briefcase, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState, Field, Modal, inputClass } from './ui.jsx';
import { CLIENT_COLORS } from '../types/index.js';
import { formatDuration } from '../utils/time.js';
import { sessionsForDay, taskElapsed } from '../utils/sessions.js';

export function ClientsView({ state, actions, now }) {
  const [editing, setEditing] = useState(null); // client draft or null
  const [confirmDelete, setConfirmDelete] = useState(null);

  const stats = useMemo(() => {
    const today = sessionsForDay(state.tasks, now, now);
    const map = new Map();
    for (const c of state.clients) map.set(c.id, { total: 0, today: 0, open: 0 });
    for (const t of state.tasks) {
      const row = map.get(t.clientId);
      if (!row) continue;
      row.total += taskElapsed(t, now);
      if (t.status !== 'completed' && t.kind !== 'interruption') row.open += 1;
    }
    for (const s of today) {
      const row = map.get(s.task.clientId);
      if (row) row.today += s.duration;
    }
    return map;
  }, [state.tasks, state.clients, now]);

  const nextColor = CLIENT_COLORS[state.clients.length % CLIENT_COLORS.length];
  const startNew = () => setEditing({ id: null, name: '', color: nextColor });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Each client has a color that tags its tasks, calendar blocks and reports.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={startNew}>
          New client
        </Button>
      </div>

      {state.clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No clients yet"
          action={
            <Button variant="primary" icon={Plus} onClick={startNew}>
              Add your first client
            </Button>
          }
        >
          Add the clients you work for, then pick one when creating a task to see time per client in the calendar and exports.
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state.clients.map((c) => {
            const s = stats.get(c.id) ?? { total: 0, today: 0, open: 0 };
            return (
              <Card key={c.id} className="flex items-center gap-3 border-l-4 p-4" style={{ borderLeftColor: c.color }}>
                <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: c.color }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{c.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {s.open} open task{s.open === 1 ? '' : 's'} · today {formatDuration(s.today)} · total {formatDuration(s.total)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" icon={Pencil} onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`} title="Edit" />
                <Button variant="danger" size="icon" icon={Trash2} onClick={() => setConfirmDelete(c)} aria-label={`Delete ${c.name}`} title="Delete" />
              </Card>
            );
          })}
        </div>
      )}

      <ClientModal
        draft={editing}
        onClose={() => setEditing(null)}
        onSave={(client) => {
          actions.saveClient(client);
          setEditing(null);
        }}
        existingNames={state.clients.filter((c) => c.id !== editing?.id).map((c) => c.name.toLowerCase())}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete client?"
        footer={
          <>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="dangerSolid"
              icon={Trash2}
              onClick={() => {
                actions.deleteClient(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          “{confirmDelete?.name}” will be removed. Its tasks and tracked time stay, they just won’t have a client.
        </p>
      </Modal>
    </div>
  );
}

/** Create / edit a client: name plus a color from the palette or a custom one. */
export function ClientModal({ draft, onClose, onSave, existingNames = [] }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CLIENT_COLORS[0]);
  const [lastDraft, setLastDraft] = useState(null);

  // Reset the form whenever a different draft is opened.
  if (draft !== lastDraft) {
    setLastDraft(draft);
    if (draft) {
      setName(draft.name);
      setColor(draft.color);
    }
  }

  const trimmed = name.trim();
  const duplicate = existingNames.includes(trimmed.toLowerCase());
  const valid = trimmed.length > 0 && !duplicate;
  const submit = () => valid && onSave({ ...(draft.id ? { id: draft.id } : {}), name: trimmed, color });

  return (
    <Modal
      open={!!draft}
      onClose={onClose}
      title={draft?.id ? 'Edit client' : 'New client'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Check} onClick={submit} disabled={!valid}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Client name" hint={duplicate ? 'A client with this name already exists.' : undefined}>
          <input autoFocus className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Contoso Retail" />
        </Field>
        <div>
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {CLIENT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-110 dark:ring-offset-slate-900 ${
                  color === c ? 'ring-2 ring-slate-900 dark:ring-white' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              >
                {color === c && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-1.5 text-xs text-slate-500" title="Custom color">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
              Custom
            </label>
          </div>
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
