import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveBar } from './components/ActiveBar.jsx';
import { TasksView } from './components/TasksView.jsx';
import { SubtasksView } from './components/SubtasksView.jsx';
import { TemplatesView } from './components/TemplatesView.jsx';
import { CalendarView } from './components/CalendarView.jsx';
import { ClientsView } from './components/ClientsView.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { StartPrompt } from './components/StartPrompt.jsx';
import { EstimateAlert } from './components/EstimateAlert.jsx';
import { LegalPage } from './components/LegalPage.jsx';
import { Footer } from './components/Footer.jsx';
import { ConsentBanner } from './components/ConsentBanner.jsx';
import { AdSlot } from './components/AdSlot.jsx';
import { useTracker } from './hooks/useTracker.js';
import { useNow } from './hooks/useNow.js';
import { useTheme } from './hooks/useTheme.js';
import { useEstimateAlerts } from './hooks/useEstimateAlerts.js';
import { useLegalRoute } from './hooks/useLegalRoute.js';
import { useAdsConsent } from './hooks/useAdsConsent.js';
import { useClientAccent } from './hooks/useClientAccent.js';
import { useClientRoute } from './hooks/useClientRoute.js';
import { ClientDashboard } from './components/ClientDashboard.jsx';
import { clientForSlug, clientPath } from './utils/clientRoute.js';
import { DEFAULT_SETTINGS } from './utils/reducer.js';
import { unlockAudioOnFirstGesture } from './utils/alerts.js';

export default function App() {
  const { state, actions, activeTask } = useTracker();
  const now = useNow(1000);
  const { theme, toggle } = useTheme();
  const [view, setViewState] = useState('tasks');
  const { legalDoc, closeLegal } = useLegalRoute();
  const ads = useAdsConsent();
  const { clientSlug, openClient, closeClient } = useClientRoute();
  const setView = useCallback(
    (v) => {
      closeLegal();
      closeClient();
      setViewState(v);
    },
    [closeLegal, closeClient],
  );
  const dashboardClient = clientSlug ? clientForSlug(clientSlug, state.clients) : null;
  // Renaming the client changes its slug: keep the dashboard open at the new URL.
  const lastClientId = useRef(null);
  useEffect(() => {
    if (dashboardClient) lastClientId.current = dashboardClient.id;
    else if (clientSlug && lastClientId.current) {
      const renamed = state.clients.find((c) => c.id === lastClientId.current);
      if (renamed) {
        history.replaceState(null, '', clientPath(renamed, state.clients) + window.location.hash);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [dashboardClient, clientSlug, state.clients]);
  const showClient = useCallback(
    (client) => {
      closeLegal();
      setViewState('clients');
      openClient(clientPath(client, state.clients));
    },
    [closeLegal, openClient, state.clients],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [created, setCreated] = useState(null); // { id, title } of a task created but not started
  const [focusTaskId, setFocusTaskId] = useState(null); // task to show on the Tasks page
  const openTask = useCallback(
    (id) => {
      setFocusTaskId(id);
      setView('tasks');
    },
    [setView],
  );

  const onCreated = useCallback((id, title) => setCreated({ id, title }), []);
  const dismissCreated = useCallback(() => setCreated(null), []);

  const settings = { ...DEFAULT_SETTINGS, ...state.settings };
  const { alert, dismiss: dismissAlert } = useEstimateAlerts({ activeTask, now, settings, actions });
  useEffect(() => unlockAudioOnFirstGesture(), []);
  useClientAccent(activeTask, state.clients);

  return (
    <div className="flex min-h-screen flex-col">
      <ActiveBar
        state={state}
        activeTask={activeTask}
        actions={actions}
        now={now}
        view={clientSlug ? 'clients' : view}
        setView={setView}
        theme={theme}
        toggleTheme={toggle}
        onCreated={onCreated}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {legalDoc && <LegalPage docId={legalDoc} onBack={closeLegal} />}
        {!legalDoc && clientSlug && (
          <ClientDashboard
            client={dashboardClient}
            state={state}
            activeTask={activeTask}
            actions={actions}
            now={now}
            onBack={() => setView('clients')}
            onCreated={onCreated}
            onManageTemplates={() => setView('templates')}
            onManageClients={() => setView('clients')}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {!legalDoc && !clientSlug && view === 'tasks' && (
          <TasksView
            state={state}
            activeTask={activeTask}
            actions={actions}
            now={now}
            onCreated={onCreated}
            onManageTemplates={() => setView('templates')}
            onManageClients={() => setView('clients')}
            onOpenSettings={() => setSettingsOpen(true)}
            focusTaskId={focusTaskId}
            onFocused={() => setFocusTaskId(null)}
          />
        )}
        {!legalDoc && !clientSlug && view === 'subtasks' && (
          <SubtasksView state={state} actions={actions} now={now} onOpenTasks={() => setView('tasks')} onOpenTask={openTask} onOpenSettings={() => setSettingsOpen(true)} />
        )}
        {!legalDoc && !clientSlug && view === 'calendar' && <CalendarView tasks={state.tasks} clients={state.clients} now={now} />}
        {!legalDoc && !clientSlug && view === 'clients' && <ClientsView state={state} actions={actions} now={now} onOpenClient={showClient} />}
        {!legalDoc && !clientSlug && view === 'templates' && <TemplatesView templates={state.templates} actions={actions} onCreated={onCreated} />}
      </main>
      {!legalDoc && <AdSlot allowed={ads.adsAllowed} className="pb-6" />}
      <Footer showChoices={ads.adsEnabled} onOpenChoices={ads.openChoices} />
      <ConsentBanner open={ads.bannerOpen} status={ads.status} onAccept={ads.accept} onReject={ads.reject} onClose={ads.close} />
      <EstimateAlert alert={alert} actions={actions} onDismiss={dismissAlert} />
      <StartPrompt created={created} hasActive={!!activeTask} onStart={actions.start} onDismiss={dismissCreated} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={state.settings} onSave={actions.updateSettings} />
    </div>
  );
}
