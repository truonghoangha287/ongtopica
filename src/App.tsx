import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { HomePage } from '@/pages/HomePage';
import { WordSetPage } from '@/pages/WordSetPage';
import { SkillHubPage } from '@/pages/SkillHubPage';
import { TopicActivitiesPage } from '@/pages/TopicActivitiesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SessionPlayer } from '@/english/vocab/components/SessionPlayer';
import { AchievementsPage } from '@/english/vocab/components/AchievementsPage';
import { MemoryMatchPage } from '@/english/vocab/components/MemoryMatchPage';
import { WordClozePage } from '@/english/vocab/reading-writing/WordClozePage';
import { YesNoPage } from '@/english/vocab/reading-writing/YesNoPage';
import { PrepositionPage } from '@/english/vocab/reading-writing/PrepositionPage';
import { PictureQaPage } from '@/english/vocab/reading-writing/PictureQaPage';
import { GrammarHubPage } from '@/english/grammar/components/GrammarHubPage';
import { GrammarDrillPage } from '@/english/grammar/components/GrammarDrillPage';
import { TopicJourneyPage } from '@/math/pages/TopicJourneyPage';
import { MathQuizPage } from '@/math/pages/MathQuizPage';
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
          <Route path="/skill/:skillId" element={<SkillHubPage />} />
          <Route path="/skill/:skillId/:topicId" element={<TopicActivitiesPage />} />
          <Route path="/word-sets/:id" element={<WordSetPage />} />
          <Route path="/session" element={<SessionRoute />} />
          <Route path="/memory/:id" element={<MemoryMatchPage />} />
          <Route path="/rw/cloze" element={<WordClozePage />} />
          <Route path="/rw/yes-no" element={<YesNoPage />} />
          <Route path="/rw/preposition" element={<PrepositionPage />} />
          <Route path="/rw/picture-qa" element={<PictureQaPage />} />
          <Route path="/grammar" element={<GrammarHubPage />} />
          <Route path="/grammar/:gameId" element={<GrammarDrillPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/math/topic/:id" element={<TopicJourneyPage />} />
          <Route path="/math/quiz/:id" element={<MathQuizPage />} />
        </Routes>
      </BrowserRouter>
    </I18nextProvider>
  );
}
