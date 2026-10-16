import { useCallback, useEffect, useState } from 'react';
import { ActiveBar } from './components/ActiveBar.jsx';
import { TasksView } from './components/TasksView.jsx';
import { TemplatesView } from './components/TemplatesView.jsx';
import { CalendarView } from './components/CalendarView.jsx';
import { ClientsView } from './components/ClientsView.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { StartPrompt } from './components/StartPrompt.jsx';
import { EstimateAlert } from './components/EstimateAlert.jsx';
import { useTracker } from './hooks/useTracker.js';
import { useNow } from './hooks/useNow.js';
import { useTheme } from './hooks/useTheme.js';
import { useEstimateAlerts } from './hooks/useEstimateAlerts.js';
import { DEFAULT_SETTINGS } from './utils/reducer.js';
import { unlockAudioOnFirstGesture } from './utils/alerts.js';

export default function App() {
  const { state, actions, activeTask } = useTracker();
  const now = useNow(1000);
  const { theme, toggle } = useTheme();
  const [view, setView] = useState('tasks');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [created, setCreated] = useState(null); // { id, title } of a task created but not started

  const onCreated = useCallback((id, title) => setCreated({ id, title }), []);
  const dismissCreated = useCallback(() => setCreated(null), []);

  const settings = { ...DEFAULT_SETTINGS, ...state.settings };
  const { alert, dismiss: dismissAlert } = useEstimateAlerts({ activeTask, now, settings, actions });
  useEffect(() => unlockAudioOnFirstGesture(), []);

  return (
    <div className="min-h-screen">
      <ActiveBar
        state={state}
        activeTask={activeTask}
        actions={actions}
        now={now}
        view={view}
        setView={setView}
        theme={theme}
        toggleTheme={toggle}
        onCreated={onCreated}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {view === 'tasks' && (
          <TasksView
            state={state}
            activeTask={activeTask}
            actions={actions}
            now={now}
            onCreated={onCreated}
            onManageTemplates={() => setView('templates')}
            onManageClients={() => setView('clients')}
          />
        )}
        {view === 'calendar' && <CalendarView tasks={state.tasks} clients={state.clients} now={now} />}
        {view === 'clients' && <ClientsView state={state} actions={actions} now={now} />}
        {view === 'templates' && <TemplatesView templates={state.templates} actions={actions} onCreated={onCreated} />}
      </main>
      <EstimateAlert alert={alert} actions={actions} onDismiss={dismissAlert} />
      <StartPrompt created={created} hasActive={!!activeTask} onStart={actions.start} onDismiss={dismissCreated} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={state.settings} onSave={actions.updateSettings} />
    </div>
  );
}
