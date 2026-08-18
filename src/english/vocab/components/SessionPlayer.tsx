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
import {
  LISTEN_MATCH_OPTION_COUNT,
  SHATTER_ANIM_MS,
  HEARTS_ROW_RESERVED_HEIGHT,
} from '@/shared/constants/game-constants';
import { HeartRow } from '@/english/vocab/components/heart-row';
import { OutOfHeartsScreen } from '@/english/vocab/components/OutOfHeartsScreen';
import { CelebrationScreen } from '@/english/vocab/components/CelebrationScreen';
import { AchievementBanner } from '@/english/vocab/components/achievement-banner';
import { selectDistractors } from '@/english/vocab/services/session-composer';
import { getWordSet } from '@/data/yle-starters/index';
import type { SessionPlayerProps } from '@/english/vocab/types/vocab.types';

export function SessionPlayer({ session, onSessionComplete, onExit }: SessionPlayerProps) {
  const { t } = useTranslation('vocab');
  const {
    currentIndex,
    advance,
    incrementRetry,
    restart,
    clearSession,
    heartsMax,
    heartsRemaining,
    loseHeart,
  } = useSessionStore();
  const wordProgress = useWordProgress();
  const achievements = useAchievements();
  const completionHandled = useRef(false);
  const [newAchievementIds, setNewAchievementIds] = useState<string[]>([]);
  const [confirmingExit, setConfirmingExit] = useState(false);
  // Set only once the last heart is spent AND the child has seen the answer.
  // Every activity now reaches it through onAdvance, i.e. the child's own Next tap.
  const [outOfHearts, setOutOfHearts] = useState(false);
  // Unscramble has no reveal of its own, so the last shatter asks for one — see
  // onShatter. That converges Unscramble onto the same reveal → Next → end path.
  const [revealUnscramble, setRevealUnscramble] = useState(false);

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
    setRevealUnscramble(false);
    restart();
  };

  const handleTryAgain = () => {
    setOutOfHearts(false);
    // The exit dialog must not survive onto the restarted session.
    setConfirmingExit(false);
    handlePlayAgain();
  };

  if (outOfHearts) {
    return <OutOfHeartsScreen onTryAgain={handleTryAgain} onGoHome={handleExit} />;
  }

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
      {heartsMax > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 58,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <HeartRow remaining={heartsRemaining} max={heartsMax} />
        </div>
      )}
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
      // One heart per revealed word — Recognize, Listen-Match and Fill-in-blank
      // each give a free retry first. (Unscramble is the exception: it has no
      // reveal to hang a failure on, so it charges per shatter — see onShatter.)
      // Hearts are pure UI state with no dependency on the write below, so
      // spend it synchronously first — otherwise a fast Next tap can race the
      // await and read a stale heart count (see onAdvance). The end screen
      // still waits for onAdvance, so the child gets to read the answer.
      loseHeart();
      await wordProgress.recordIncorrect(currentItem.word.id, currentItem.word.wordSetId);
    },
    onShatter: () => {
      loseHeart();
      // Read both counts from the store, never the render closure, so a tap
      // that lands before this render's state settles still sees the
      // post-decrement value — getState() is always current.
      const { heartsMax: max, heartsRemaining: left } = useSessionStore.getState();
      if (max > 0 && left === 0) {
        // Let the break finish, then spell the word out. From there Unscramble
        // behaves like every other activity: the child reads the answer and
        // taps Next, and onAdvance below swaps in the end screen.
        setTimeout(() => setRevealUnscramble(true), SHATTER_ANIM_MS);
      }
    },
    onAdvance: () => {
      // The heart was spent in onReveal / onShatter, not here; the swap waits
      // until this callback so the child reads the revealed answer first. Read
      // the store directly (not the render closure) so this guard can't see a
      // stale pre-decrement value if the child advances before the onReveal
      // await resolves and re-renders.
      const { heartsMax: max, heartsRemaining: left } = useSessionStore.getState();
      if (max > 0 && left === 0) {
        setOutOfHearts(true);
        return;
      }
      advance();
    },
  };

  // Reserve extra top space for the heart row only when it's actually
  // rendered, so activity content can never ride up under it on a short
  // viewport. With hearts off this is byte-for-byte the same style object
  // every branch used before — no extra padding, no layout shift.
  const activityWrapperStyle = heartsMax > 0
    ? { position: 'relative' as const, minHeight: '100vh', paddingTop: HEARTS_ROW_RESERVED_HEIGHT }
    : { position: 'relative' as const, minHeight: '100vh' };

  if (currentItem.activityType === 'introduce') {
    return (
      <div style={activityWrapperStyle}>
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
      <div style={activityWrapperStyle}>
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
      <div style={activityWrapperStyle}>
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
      <div style={activityWrapperStyle}>
        {exitBtn}
        <UnscrambleActivity
          key={currentItem.word.id}
          word={currentItem.word}
          callbacks={callbacks}
          reveal={revealUnscramble}
        />
      </div>
    );
  }

  if (currentItem.activityType === 'fill-in-blank') {
    return (
      <div style={activityWrapperStyle}>
        {exitBtn}
        <FillInBlankActivity key={currentItem.word.id} word={currentItem.word} callbacks={callbacks} />
      </div>
    );
  }

  return null;
}
