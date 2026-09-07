import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getWordSet, wordSetIcon } from '@/data/word-sets';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { useAnswerFeedback } from '@/english/vocab/components/answer-feedback';
import { HeartRow } from '@/english/vocab/components/heart-row';
import { OutOfHeartsScreen } from '@/english/vocab/components/OutOfHeartsScreen';
import { LetterKeypad } from '@/english/vocab/components/LetterKeypad';
import { heartsCountFor, readHeartsMode } from '@/english/vocab/services/hearts-settings';
import {
  initialTypeWordState,
  pickTypingWords,
  typeWordReducer,
  type TypeWordAction,
} from '@/english/vocab/services/type-word';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { Mascot } from '@/shared/components/Mascot';
import { playBreak, playBuzz, playPop, playWin } from '@/shared/utils/sfx';
import { TYPE_WORD_ROUNDS } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

/**
 * Type the Word: see the picture, hear the word, spell it.
 *
 * A standalone scoped page rather than a fifth stage of `SessionPlayer`,
 * because the star ladder is exactly four stages deep and every progress
 * calculation in `skills.ts` is written against that. Memory Match is
 * structured the same way for the same reason.
 *
 * Every rule lives in `services/type-word.ts`; this component turns the
 * reducer's `effect` into sound, animation and hearts.
 */
export function TypeWordPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const wordSet = id ? getWordSet(id) : undefined;
  const wordProgress = useWordProgress();
  const { signalCorrect, signalWrong, feedbackNode } = useAnswerFeedback();

  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [heartsMax] = useState(() => heartsCountFor(readHeartsMode()));
  const [heartsLeft, setHeartsLeft] = useState<number>(heartsMax);
  const [celebrating, setCelebrating] = useState(false);
  const [mascot, setMascot] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [shakingLetter, setShakingLetter] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!wordSet) return;
    wordProgress.getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((row) => [row.wordId, row])));
      setReady(true);
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chosen once per visit: re-picking as progress updates would swap the word
  // out from under the child mid-spelling.
  const words = useMemo(
    () => (wordSet && ready ? pickTypingWords(wordSet, progressMap, TYPE_WORD_ROUNDS) : []),
    [wordSet, ready], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const word = words[index];
  const target = word?.text ?? '';

  const [state, dispatch] = useReducer(
    (current: ReturnType<typeof initialTypeWordState>, action: TypeWordAction) =>
      typeWordReducer(current, action, target).state,
    undefined,
    initialTypeWordState,
  );

  const outOfHearts = heartsMax > 0 && heartsLeft <= 0;
  const finished = ready && words.length > 0 && index >= words.length;

  const handleLetter = useCallback(
    (letter: string) => {
      if (!word || state.done || outOfHearts) return;
      const { effect } = typeWordReducer(state, { type: 'letter', letter }, target);
      dispatch({ type: 'letter', letter });

      switch (effect) {
        case 'correct':
          playPop();
          setAnnounce(t('activities.typeWord.announceLetter', { letter }));
          break;
        case 'cleared':
        case 'cleared-costly':
          setShakingLetter(letter);
          if (shakeTimer.current) clearTimeout(shakeTimer.current);
          shakeTimer.current = setTimeout(() => setShakingLetter(null), 350);
          setMascot('encourage');
          signalWrong({ silent: true });
          setAnnounce(t('activities.typeWord.announceCleared'));
          if (effect === 'cleared-costly') {
            playBreak();
            setHeartsLeft((left) => Math.max(0, left - 1));
          } else {
            playBuzz();
          }
          break;
        case 'complete':
          playWin();
          setCelebrating(true);
          setMascot('celebrate');
          setAnnounce(t('activities.typeWord.announceDone', { word: target }));
          signalCorrect({ silent: true, label: t('activities.typeWord.wellDone') });
          if (wordSet) wordProgress.recordCorrect(word.id, wordSet.id);
          break;
        case 'none':
          break;
      }
    },
    [word, state, target, outOfHearts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleBackspace = useCallback(() => {
    if (!word || state.done || outOfHearts) return;
    dispatch({ type: 'backspace' });
  }, [word, state.done, outOfHearts]);

  // A real keyboard drives the same handlers as the on-screen keys, so there is
  // one code path and no way for the two inputs to diverge.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }
      if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        handleLetter(event.key.toLowerCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleLetter, handleBackspace]);

  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
  }, []);

  const advance = () => {
    setCelebrating(false);
    setMascot('idle');
    setAnnounce('');
    dispatch({ type: 'reset' });
    setIndex((current) => current + 1);
  };

  const restart = () => {
    setHeartsLeft(heartsMax);
    setCelebrating(false);
    setMascot('idle');
    setAnnounce('');
    dispatch({ type: 'reset' });
    setIndex(0);
  };

  if (!wordSet) return <div className="page">Word set not found.</div>;

  if (ready && words.length === 0) {
    // Every word here is a card showing its own spelling, or has a letter the
    // keypad cannot type. Saying so beats an empty screen.
    return (
      <div className="page" style={{ maxWidth: 520 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>✕</button>
        <p style={{ marginTop: 24, fontWeight: 700, color: 'var(--muted-fg)' }}>
          {t('activities.typeWord.noWords')}
        </p>
      </div>
    );
  }

  if (outOfHearts) {
    return <OutOfHeartsScreen onTryAgain={restart} onGoHome={() => navigate(-1)} />;
  }

  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <CelebrationEffect active={celebrating} />
      {feedbackNode}

      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>✕</button>
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>{wordSetIcon(wordSet.id)}</span>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{t('activities.typeWord.title')}</h1>
        <span style={{ marginLeft: 'auto' }}>
          <HeartRow remaining={heartsLeft} max={heartsMax} />
        </span>
      </header>

      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }}>
        {announce}
      </div>

      {!word ? (
        // Progress is still loading, so there is nothing to spell yet. Without
        // this the first paint dereferences an undefined word and throws.
        <p style={{ textAlign: 'center', color: 'var(--muted-fg)', fontWeight: 700 }}>
          {t('session.loading', 'Loading…')}
        </p>
      ) : finished ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 40 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('activities.typeWord.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('session.reviewAllButton')}
            </button>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('session.exitButton')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'center', color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 12px' }}>
            {t('activities.typeWord.prompt')}
            <span className="badge" style={{ marginLeft: 10 }}>
              {t('activities.typeWord.counter', { current: index + 1, total: words.length })}
            </span>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="card" style={{ display: 'grid', placeItems: 'center', width: 168, height: 168, padding: 16 }}>
              <img
                src={word.pictureAsset}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            <AudioPlayer src={word.audioAsset} autoPlay />
            <Mascot reaction={mascot} />

            <motion.div
              role="group"
              aria-label={t('activities.typeWord.slotsAria')}
              style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}
              animate={state.done ? { scale: [1, 1.07, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              {[...target].map((_letter, slot) => {
                const filled = slot < state.typed.length;
                return (
                  <span
                    key={slot}
                    // A bare span may not carry aria-label; the slot is a
                    // graphical stand-in for one letter, so role="img" is what
                    // makes the label legal and meaningful.
                    role="img"
                    aria-label={
                      filled
                        ? t('activities.typeWord.slotFilled', { position: slot + 1, letter: state.typed[slot] })
                        : t('activities.typeWord.slotEmpty', { position: slot + 1 })
                    }
                    style={{
                      width: 40,
                      height: 52,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      background: state.done ? 'var(--success)' : filled ? 'var(--secondary)' : 'var(--paper)',
                      color: state.done ? '#fff' : 'var(--ink)',
                      border: `2px solid ${state.done ? 'var(--success)' : 'var(--primary)'}`,
                    }}
                  >
                    {filled ? state.typed[slot] : ''}
                  </span>
                );
              })}
            </motion.div>

            {state.done ? (
              <button
                className="btn-accent"
                onClick={advance}
                style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
              >
                <span>{t('activities.introduce.nextButton')}</span> <span aria-hidden="true">→</span>
              </button>
            ) : (
              <LetterKeypad
                onLetter={handleLetter}
                onBackspace={handleBackspace}
                shakingLetter={shakingLetter}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
