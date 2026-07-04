import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { useAchievements } from '@/english/vocab/hooks/useAchievements';
import { IntroduceActivity } from '@/english/vocab/components/activities/IntroduceActivity';
import { RecognizeActivity } from '@/english/vocab/components/activities/RecognizeActivity';
import { UnscrambleActivity } from '@/english/vocab/components/activities/UnscrambleActivity';
import { FillInBlankActivity } from '@/english/vocab/components/activities/FillInBlankActivity';
import { ListenMatchActivity } from '@/english/vocab/components/activities/ListenMatchActivity';
import { LISTEN_MATCH_OPTION_COUNT } from '@/shared/constants/game-constants';
import { CelebrationScreen } from '@/english/vocab/components/CelebrationScreen';
import { AchievementBanner } from '@/english/vocab/components/achievement-banner';
import { selectDistractors } from '@/english/vocab/services/session-composer';
import { getWordSet } from '@/data/yle-starters/index';
import type { SessionPlayerProps } from '@/english/vocab/types/vocab.types';

export function SessionPlayer({ session, onSessionComplete, onExit }: SessionPlayerProps) {
  const { t } = useTranslation('vocab');
  const { currentIndex, advance, incrementRetry, restart, clearSession } = useSessionStore();
  const wordProgress = useWordProgress();
  const achievements = useAchievements();
  const completionHandled = useRef(false);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);
  const [confirmingExit, setConfirmingExit] = useState(false);

  const isComplete = currentIndex >= session.items.length;
  const currentItem = isComplete ? null : session.items[currentIndex];
  const wordSet = getWordSet(session.wordSetId);

  // When session completes: record introduced words, advance cursor, evaluate achievements
  useEffect(() => {
    if (!isComplete || completionHandled.current) return;
    completionHandled.current = true;

    const runCompletion = async () => {
      // L&L: record introduced + advance cursor
      if (session.stageFilter === 1) {
        const wordIds = session.items.map((item) => item.word.id);
        await wordProgress.recordIntroduced(wordIds, session.wordSetId);
        if (session.wordSetTotalCount != null) {
          await wordProgress.advanceRotationCursor(session.wordSetId, session.wordSetTotalCount);
        }
      }

      // Evaluate achievements against fresh progress
      const allRows = await wordProgress.getAllProgress();
      const progressMap = Object.fromEntries(allRows.map((r) => [r.wordId, r]));
      const newIds = await achievements.recordNewAchievements(progressMap);
      setNewAchievementIds(newIds);
    };

    runCompletion();
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExit = () => {
    clearSession();
    onExit();
  };

  const handleSessionDone = () => {
    clearSession();
    onSessionComplete();
  };

  const handlePlayAgain = () => {
    completionHandled.current = false;
    setNewAchievementIds([]);
    restart();
  };

  if (isComplete) {
    return (
      <CelebrationScreen
        onDone={handleSessionDone}
        onPlayAgain={handlePlayAgain}
        banner={<AchievementBanner achievementIds={newAchievementIds} />}
      />
    );
  }

  if (!currentItem) return null;

  const total = session.items.length;
  const chrome = (
    <>
      <button
        className="icon-btn"
        onClick={() => setConfirmingExit(true)}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, width: 56, height: 56, fontSize: '1.4rem' }}
        aria-label={t('session.exitButton')}
      >
        ✕
      </button>
      {confirmingExit && (
        <div
          role="dialog"
          aria-label={t('session.quitConfirm')}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 20,
            padding: 24,
          }}
        >
          <div className="card" style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{t('session.quitConfirm')}</p>
            <button
              className="btn-primary"
              onClick={() => setConfirmingExit(false)}
              style={{ minHeight: 56, fontSize: '1.1rem' }}
            >
              {t('session.keepPlaying')}
            </button>
            <button
              className="btn-accent"
              onClick={handleExit}
              style={{ minHeight: 52, fontSize: '1.05rem' }}
            >
              {t('session.quitYes')}
            </button>
          </div>
        </div>
      )}
      <div
        className="dots"
        style={{ position: 'absolute', top: 28, left: 0, right: 0, zIndex: 1 }}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={currentIndex + 1}
        aria-label={`${currentIndex + 1} / ${total}`}
      >
        {session.items.map((_, i) => (
          <i key={i} className={i === currentIndex ? 'on' : ''} />
        ))}
      </div>
      <span
        aria-hidden="true"
        style={{ position: 'absolute', top: 16, right: 20, fontSize: '2.4rem', zIndex: 2 }}
      >
        🦉
      </span>
    </>
  );
  // Backwards-compatible alias used by the activity wrappers below.
  const exitBtn = chrome;

  const callbacks = {
    onCorrect: async () => {
      await wordProgress.recordCorrect(currentItem.word.id, currentItem.word.wordSetId);
    },
    onIncorrect: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
      incrementRetry();
    },
    onReveal: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
    },
    onAdvance: () => advance(),
  };

  if (currentItem.activityType === 'introduce') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {exitBtn}
        <IntroduceActivity
          key={currentItem.word.id}
          word={currentItem.word}
          onComplete={async () => {
            await wordProgress.recordCorrect(currentItem.word.id, currentItem.word.wordSetId);
            advance();
          }}
        />
      </div>
    );
  }

  if (currentItem.activityType === 'recognize' && wordSet) {
    const distractors = selectDistractors(currentItem.word.id, wordSet, 3);
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {exitBtn}
        <RecognizeActivity
          key={currentItem.word.id}
          word={currentItem.word}
          distractors={distractors}
          callbacks={callbacks}
        />
      </div>
    );
  }

  if (currentItem.activityType === 'listen-match' && wordSet) {
    const distractors = selectDistractors(currentItem.word.id, wordSet, LISTEN_MATCH_OPTION_COUNT - 1);
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {exitBtn}
        <ListenMatchActivity
          key={currentItem.word.id}
          word={currentItem.word}
          distractors={distractors}
          callbacks={callbacks}
        />
      </div>
    );
  }

  if (currentItem.activityType === 'unscramble') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {exitBtn}
        <UnscrambleActivity key={currentItem.word.id} word={currentItem.word} callbacks={callbacks} />
      </div>
    );
  }

  if (currentItem.activityType === 'fill-in-blank') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {exitBtn}
        <FillInBlankActivity key={currentItem.word.id} word={currentItem.word} callbacks={callbacks} />
      </div>
    );
  }

  return null;
}
