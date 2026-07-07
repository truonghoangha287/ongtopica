import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { useAnswerFeedback } from '@/english/vocab/components/answer-feedback';
import { MAX_RETRIES } from '@/shared/constants/game-constants';
import { seededShuffle } from '@/shared/utils/seeded-shuffle';
import type { FillInBlankActivityProps } from '@/english/vocab/types/vocab.types';

export function FillInBlankActivity({ word, callbacks }: FillInBlankActivityProps) {
  const { t } = useTranslation('vocab');
  const { signalCorrect, signalWrong, feedbackNode } = useAnswerFeedback();
  const correctLetter = word.text[word.blankLetterIndex];
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [retries, setRetries] = useState(0);
  const [wrongLetter, setWrongLetter] = useState<string | null>(null);
  const [filledLetter, setFilledLetter] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const shuffledChoices = useMemo(
    () => seededShuffle([...word.letterChoices], word.id),
    [word.id, word.letterChoices]
  );

  const displayWord = word.text
    .split('')
    .map((ch, i) => (i === word.blankLetterIndex ? (filledLetter ?? '_') : ch))
    .join('');

  const handleTap = (letter: string) => {
    if (filledLetter !== null) return;
    if (letter === correctLetter) {
      setFilledLetter(letter);
      setMascotReaction('celebrate');
      setCelebrating(true);
      setDone(true);
      signalCorrect();
      callbacks.onCorrect();
    } else if (retries < MAX_RETRIES) {
      setRetries((r) => r + 1);
      setMascotReaction('encourage');
      setWrongLetter(letter);
      signalWrong();
      callbacks.onIncorrect();
      setTimeout(() => {
        setMascotReaction('idle');
        setWrongLetter(null);
      }, 800);
    } else {
      setFilledLetter(correctLetter);
      setDone(true);
      callbacks.onReveal();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '64px 24px 32px' }}>
      <CelebrationEffect active={celebrating} />
      {feedbackNode}
      <p style={{ fontSize: '1rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }}>{t('activities.fillInBlank.prompt')}</p>
      <div className="card" style={{ display: 'grid', placeItems: 'center', width: 180, height: 180, padding: 18 }}>
        <img src={word.pictureAsset} alt={word.text} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <AudioPlayer src={word.audioAsset} autoPlay />
      <Mascot reaction={mascotReaction} />
      <p
        style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '0.2em' }}
        aria-label={`word with blank: ${displayWord}`}
      >
        {displayWord}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {shuffledChoices.map((letter, i) => {
          const isChosenCorrect = done && letter === correctLetter;
          const isWrong = wrongLetter === letter;
          return (
            <motion.button
              key={i}
              onClick={() => handleTap(letter)}
              disabled={done}
              aria-label={`letter ${letter}`}
              animate={isWrong ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.35 }}
              style={{
                width: 68, height: 68, fontSize: '1.9rem', fontWeight: 800,
                borderRadius: 16, cursor: done ? 'default' : 'pointer',
                background: isChosenCorrect
                  ? 'var(--success)'
                  : isWrong
                    ? 'var(--destructive)'
                    : 'var(--paper)',
                color: isChosenCorrect || isWrong ? '#fff' : 'var(--ink)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {letter}
            </motion.button>
          );
        })}
      </div>
      {done && (
        <button
          className="btn-accent"
          onClick={callbacks.onAdvance}
          style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          <span>{t('activities.introduce.nextButton')}</span> <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
