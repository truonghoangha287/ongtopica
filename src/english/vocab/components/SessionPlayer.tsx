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
  const { currentIndex, advance, incrementRetry, clearSession } = useSessionStore();
  const wordProgress = useWordProgress();
  const achievements = useAchievements();
  const completionHandled = useRef(false);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);

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

  if (isComplete) {
    return (
      <CelebrationScreen
        onDone={handleSessionDone}
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
        onClick={handleExit}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}
        aria-label={t('session.exitButton')}
      >
        ✕
      </button>
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
