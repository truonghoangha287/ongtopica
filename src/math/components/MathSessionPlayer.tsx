import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMathSessionStore } from '@/math/store/math-session-store';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { useMathAchievements } from '@/math/hooks/useMathAchievements';
import { MathProblemPlayer } from '@/math/components/MathProblemPlayer';
import { MathCelebrationScreen } from '@/math/components/MathCelebrationScreen';
import { MathAchievementsBanner } from '@/math/components/MathAchievementsBanner';
import type { MathSessionPlayerProps, MathProgressMap } from '@/math/types/math.types';

/** Drives one math session: one problem at a time, then a celebration. */
export function MathSessionPlayer({ session, onSessionComplete, onExit }: MathSessionPlayerProps) {
  const { t } = useTranslation('math');
  const { currentIndex, advance, incrementRetry, clearSession } = useMathSessionStore();
  const progress = useMathProgress();
  const achievements = useMathAchievements();
  const completionHandled = useRef(false);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);

  const isComplete = currentIndex >= session.problems.length;
  const current = isComplete ? null : session.problems[currentIndex];

  // On completion: evaluate achievements against fresh progress.
  useEffect(() => {
    if (!isComplete || completionHandled.current) return;
    completionHandled.current = true;
    const run = async () => {
      const rows = await progress.getAllProgress();
      const map: MathProgressMap = Object.fromEntries(rows.map((r) => [r.problemId, r]));
      const newIds = await achievements.recordNewAchievements(map);
      setNewAchievementIds(newIds);
    };
    run();
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExit = () => {
    clearSession();
    onExit();
  };
  const handleDone = () => {
    clearSession();
    onSessionComplete();
  };

  if (isComplete) {
    return (
      <MathCelebrationScreen
        onDone={handleDone}
        banner={<MathAchievementsBanner achievementIds={newAchievementIds} />}
      />
    );
  }
  if (!current) return null;

  const total = session.problems.length;
  const callbacks = {
    onCorrect: () => {
      void progress.recordCorrect(current.id, current.topicId);
    },
    onIncorrect: () => {
      void progress.recordIncorrect(current.id, current.topicId);
      incrementRetry();
    },
    onReveal: () => {
      void progress.recordIncorrect(current.id, current.topicId);
    },
    onAdvance: () => advance(),
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
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
        {session.problems.map((_, i) => (
          <i key={i} className={i === currentIndex ? 'on' : ''} />
        ))}
      </div>
      <span aria-hidden="true" style={{ position: 'absolute', top: 16, right: 20, fontSize: '2.4rem', zIndex: 2 }}>
        🦉
      </span>
      <MathProblemPlayer key={current.id} problem={current} callbacks={callbacks} />
    </div>
  );
}
