import { useState } from 'react';
import { ActiveBar } from './components/ActiveBar.jsx';
import { TasksView } from './components/TasksView.jsx';
import { TemplatesView } from './components/TemplatesView.jsx';
import { CalendarView } from './components/CalendarView.jsx';
import { useTracker } from './hooks/useTracker.js';
import { useNow } from './hooks/useNow.js';
import { useTheme } from './hooks/useTheme.js';

export default function App() {
  const { state, actions, activeTask } = useTracker();
  const now = useNow(1000);
  const { theme, toggle } = useTheme();
  const [view, setView] = useState('tasks');

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
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {view === 'tasks' && (
          <TasksView state={state} activeTask={activeTask} actions={actions} now={now} onManageTemplates={() => setView('templates')} />
        )}
        {view === 'calendar' && <CalendarView tasks={state.tasks} now={now} />}
        {view === 'templates' && <TemplatesView templates={state.templates} actions={actions} />}
      </main>
    </div>
  );
}
