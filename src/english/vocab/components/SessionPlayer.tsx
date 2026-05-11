import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/english/vocab/store/session-store';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { IntroduceActivity } from '@/english/vocab/components/activities/IntroduceActivity';
import { RecognizeActivity } from '@/english/vocab/components/activities/RecognizeActivity';
import { UnscrambleActivity } from '@/english/vocab/components/activities/UnscrambleActivity';
import { FillInBlankActivity } from '@/english/vocab/components/activities/FillInBlankActivity';
import { CelebrationScreen } from '@/english/vocab/components/CelebrationScreen';
import { selectDistractors } from '@/english/vocab/services/session-composer';
import { getWordSet } from '@/data/yle-starters/index';
import type { SessionPlayerProps } from '@/english/vocab/types/vocab.types';

export function SessionPlayer({ session, onSessionComplete, onExit }: SessionPlayerProps) {
  const { t } = useTranslation('vocab');
  const { currentIndex, advance, incrementRetry, clearSession } = useSessionStore();
  const wordProgress = useWordProgress();

  const isComplete = currentIndex >= session.items.length;
  const currentItem = isComplete ? null : session.items[currentIndex];
  const wordSet = getWordSet(session.wordSetId);

  const handleExit = () => {
    clearSession();
    onExit();
  };

  if (isComplete) {
    return (
      <CelebrationScreen
        onDone={() => {
          clearSession();
          onSessionComplete();
        }}
      />
    );
  }

  if (!currentItem) return null;

  const exitBtn = (
    <button
      onClick={handleExit}
      style={{ position: 'absolute', top: 16, right: 16, minWidth: 48, minHeight: 48 }}
      aria-label={t('session.exitButton')}
    >
      ✕
    </button>
  );

  const callbacks = {
    onCorrect: async () => {
      await wordProgress.recordCorrect(currentItem.word.id, currentItem.word.wordSetId);
      // Do NOT advance here — activity shows Next button; onAdvance handles the move
    },
    onIncorrect: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
      incrementRetry();
    },
    onReveal: async () => {
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
      // Do NOT advance here — activity shows Next button; onAdvance handles the move
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
            // recordCorrect BEFORE advance — ensures progress saved first
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
