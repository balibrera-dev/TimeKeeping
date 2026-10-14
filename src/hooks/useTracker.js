import { useEffect, useMemo, useReducer, useRef } from 'react';
import { reducer, sanitizeState } from '../utils/reducer.js';
import { STORAGE_KEY, loadState, saveState } from '../utils/storage.js';

/**
 * App state: templates, tasks, timers and logs. Persists every change to
 * localStorage and picks up changes made in another tab of the app.
 */
export function useTracker() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const fromOtherTab = useRef(false);

  useEffect(() => {
    if (fromOtherTab.current) {
      fromOtherTab.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const next = sanitizeState(JSON.parse(e.newValue));
        if (next) {
          fromOtherTab.current = true;
          dispatch({ type: 'HYDRATE', state: next });
        }
      } catch {
        /* ignore malformed writes */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const actions = useMemo(() => {
    const now = () => Date.now();
    return {
      saveTemplate: (template) => dispatch({ type: 'TEMPLATE_SAVE', template, now: now() }),
      deleteTemplate: (id) => dispatch({ type: 'TEMPLATE_DELETE', id }),
      createTask: (input) => dispatch({ type: 'TASK_CREATE', ...input, now: now() }),
      updateTask: (id, patch) => dispatch({ type: 'TASK_UPDATE', id, patch }),
      deleteTask: (id) => dispatch({ type: 'TASK_DELETE', id }),
      /** Start or switch: pauses whatever is running in the same update. */
      start: (id) => dispatch({ type: 'TASK_START', id, now: now() }),
      pause: (id) => dispatch({ type: 'TASK_PAUSE', id, now: now() }),
      pauseAll: () => dispatch({ type: 'PAUSE_ALL', now: now() }),
      reset: (id) => dispatch({ type: 'TASK_RESET', id }),
      complete: (id) => dispatch({ type: 'TASK_COMPLETE', id, now: now() }),
      reopen: (id) => dispatch({ type: 'TASK_REOPEN', id }),
      toggleSubtask: (taskId, subtaskId) => dispatch({ type: 'SUBTASK_TOGGLE', taskId, subtaskId }),
      addSubtask: (taskId, title, estimate) => dispatch({ type: 'SUBTASK_ADD', taskId, title, estimate }),
      removeSubtask: (taskId, subtaskId) => dispatch({ type: 'SUBTASK_REMOVE', taskId, subtaskId }),
      setNotes: (id, notes) => dispatch({ type: 'NOTES_SET', id, notes }),
    };
  }, []);

  const activeTask = state.tasks.find((t) => t.status === 'active') ?? null;

  return { state, actions, activeTask };
}
