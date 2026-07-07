import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { useAnswerFeedback } from '@/english/vocab/components/answer-feedback';
import { playWin } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import type { Word } from '@/shared/types';

const ROUNDS = 6;

interface Round {
  picture: Word; // word shown as the picture
  spoken: Word; // word used in the sentence
  isTrue: boolean; // true when spoken === picture
}

const allWords: Word[] = wordSetRegistry.flatMap((ws) => ws.words);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function buildRounds(): Round[] {
  return Array.from({ length: ROUNDS }, () => {
    const picture = pick(allWords);
    const isTrue = Math.random() < 0.5;
    if (isTrue) return { picture, spoken: picture, isTrue };
    // Prefer a different word from the same set for a plausible-but-wrong sentence.
    const sameSet = allWords.filter(
      (w) => w.wordSetId === picture.wordSetId && w.id !== picture.id
    );
    const pool = sameSet.length ? sameSet : allWords.filter((w) => w.id !== picture.id);
    return { picture, spoken: pick(pool), isTrue };
  });
}

export function YesNoPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { signalCorrect, signalWrong, feedbackNode } = useAnswerFeedback();

  const [seed, setSeed] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rounds = useMemo(() => buildRounds(), [seed]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false); // correct answer locked in
  const [wrong, setWrong] = useState<boolean | null>(null); // which button shook
  const [done, setDone] = useState(false);

  const round = rounds[index];
  const isComplete = done;

  // Read the sentence aloud each time a new round appears.
  useEffect(() => {
    if (!round || isComplete) return;
    speak(t('activities.yesNo.sentence', { word: round.spoken.text }));
  }, [index, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isComplete) playWin();
  }, [isComplete]);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setAnswered(false);
    setWrong(null);
    setDone(false);
  }, []);

  const handleAnswer = (choice: boolean) => {
    if (answered) return;
    if (choice === round.isTrue) {
      signalCorrect();
      setWrong(null);
      setAnswered(true);
    } else {
      signalWrong({ label: t('activities.yesNo.tryAgain') });
      setWrong(choice);
      setTimeout(() => setWrong(null), 400);
    }
  };

  const next = () => {
    setAnswered(false);
    if (index + 1 >= ROUNDS) setDone(true);
    else setIndex((i) => i + 1);
  };

  const mascot = answered ? 'celebrate' : wrong !== null ? 'encourage' : 'idle';

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <CelebrationEffect active={isComplete} />
      {feedbackNode}
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('readingWriting.backButton')}>
          ✕
        </button>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{t('activities.yesNo.title')}</h1>
        <span className="badge" style={{ marginLeft: 'auto' }} aria-live="polite">
          {t('activities.yesNo.progress', { done: isComplete ? ROUNDS : index, total: ROUNDS })}
        </span>
      </header>

      {isComplete ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('activities.yesNo.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('readingWriting.playAgain')}
            </button>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('readingWriting.exit')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 18px' }}>
            {t('activities.yesNo.prompt')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <img
              src={round.picture.pictureAsset}
              alt={round.picture.text}
              style={{
                width: '100%',
                maxWidth: 260,
                height: 160,
                objectFit: 'contain',
                borderRadius: 16,
                background: 'var(--paper)',
                boxShadow: 'var(--shadow-card)',
              }}
            />
            <p style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>
              {t('activities.yesNo.sentence', { word: round.spoken.text })}
            </p>

            {answered ? (
              <button
                className="btn-accent"
                onClick={next}
                aria-label={t('activities.yesNo.wellDone')}
                style={{ minHeight: 56, padding: '0 40px', fontSize: '1.4rem' }}
              >
                →
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 16 }}>
                {([true, false] as const).map((choice) => (
                  <motion.button
                    key={String(choice)}
                    onClick={() => handleAnswer(choice)}
                    aria-label={choice ? t('activities.yesNo.yes') : t('activities.yesNo.no')}
                    animate={wrong === choice ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.35 }}
                    whileTap={{ scale: 0.94 }}
                    className="card"
                    style={{
                      width: 96,
                      height: 72,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '2rem',
                      border: 'none',
                      cursor: 'pointer',
                      color: choice ? 'var(--success)' : 'var(--destructive)',
                    }}
                  >
                    {choice ? '✓' : '✗'}
                  </motion.button>
                ))}
              </div>
            )}

            {wrong !== null && (
              <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }} aria-live="polite">
                {t('activities.yesNo.tryAgain')}
              </p>
            )}

            <div style={{ marginTop: 4 }}>
              <Mascot reaction={mascot} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
