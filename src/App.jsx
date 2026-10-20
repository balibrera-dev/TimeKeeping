import { useCallback, useEffect, useState } from 'react';
import { ActiveBar } from './components/ActiveBar.jsx';
import { TasksView } from './components/TasksView.jsx';
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
import { DEFAULT_SETTINGS } from './utils/reducer.js';
import { unlockAudioOnFirstGesture } from './utils/alerts.js';

export default function App() {
  const { state, actions, activeTask } = useTracker();
  const now = useNow(1000);
  const { theme, toggle } = useTheme();
  const [view, setViewState] = useState('tasks');
  const { legalDoc, closeLegal } = useLegalRoute();
  const ads = useAdsConsent();
  const setView = useCallback(
    (v) => {
      closeLegal();
      setViewState(v);
    },
    [closeLegal],
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [created, setCreated] = useState(null); // { id, title } of a task created but not started

  const onCreated = useCallback((id, title) => setCreated({ id, title }), []);
  const dismissCreated = useCallback(() => setCreated(null), []);

  const settings = { ...DEFAULT_SETTINGS, ...state.settings };
  const { alert, dismiss: dismissAlert } = useEstimateAlerts({ activeTask, now, settings, actions });
  useEffect(() => unlockAudioOnFirstGesture(), []);

  return (
    <div className="flex min-h-screen flex-col">
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {legalDoc && <LegalPage docId={legalDoc} onBack={closeLegal} />}
        {!legalDoc && view === 'tasks' && (
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
        {!legalDoc && view === 'calendar' && <CalendarView tasks={state.tasks} clients={state.clients} now={now} />}
        {!legalDoc && view === 'clients' && <ClientsView state={state} actions={actions} now={now} />}
        {!legalDoc && view === 'templates' && <TemplatesView templates={state.templates} actions={actions} onCreated={onCreated} />}
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
