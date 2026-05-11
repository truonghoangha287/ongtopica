import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomePage } from '@/pages/HomePage';
import { WordSetPage } from '@/pages/WordSetPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SessionPlayer } from '@/english/vocab/components/SessionPlayer';
import type { Session } from '@/english/vocab/types/vocab.types';

function SessionRoute() {
  const location = useLocation();
  const session = (location.state as { session?: Session })?.session;
  if (!session) {
    return (
      <div style={{ padding: 24 }}>
        No session found. <a href="/">Go home</a>
      </div>
    );
  }
  return (
    <SessionPlayer
      session={session}
      onSessionComplete={() => window.history.back()}
      onExit={() => window.history.back()}
    />
  );
}

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/word-sets/:id" element={<WordSetPage />} />
          <Route path="/session" element={<SessionRoute />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </I18nextProvider>
  );
}
