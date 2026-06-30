import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { MAX_RETRIES } from '@/shared/constants/game-constants';
import { seededShuffle } from '@/shared/utils/seeded-shuffle';
import type { FillInBlankActivityProps } from '@/english/vocab/types/vocab.types';

export function FillInBlankActivity({ word, callbacks }: FillInBlankActivityProps) {
  const { t } = useTranslation('vocab');
  const correctLetter = word.text[word.blankLetterIndex];
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [retries, setRetries] = useState(0);
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
      callbacks.onCorrect();
    } else if (retries < MAX_RETRIES) {
      setRetries((r) => r + 1);
      setMascotReaction('encourage');
      callbacks.onIncorrect();
      setTimeout(() => setMascotReaction('idle'), 800);
    } else {
      setFilledLetter(correctLetter);
      setDone(true);
      callbacks.onReveal();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '64px 24px 32px' }}>
      <CelebrationEffect active={celebrating} />
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
        {shuffledChoices.map((letter, i) => (
          <button
            key={i}
            onClick={() => handleTap(letter)}
            disabled={done}
            aria-label={`letter ${letter}`}
            style={{
              width: 68, height: 68, fontSize: '1.9rem', fontWeight: 800,
              borderRadius: 16, cursor: done ? 'default' : 'pointer',
              background: 'var(--paper)', color: 'var(--ink)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {letter}
          </button>
        ))}
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
