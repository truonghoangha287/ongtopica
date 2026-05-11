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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1.2rem' }}>{t('activities.fillInBlank.prompt')}</p>
      <img src={word.pictureAsset} alt={word.text} style={{ width: 200, borderRadius: 12 }} />
      <AudioPlayer src={word.audioAsset} autoPlay />
      <Mascot reaction={mascotReaction} />
      <p
        style={{ fontSize: '2.5rem', fontWeight: 'bold', letterSpacing: '0.2em' }}
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
              width: 64, height: 64, fontSize: '1.8rem', fontWeight: 'bold',
              borderRadius: 12, cursor: done ? 'default' : 'pointer', border: '2px solid #ddd',
              minWidth: 48, minHeight: 48,
            }}
          >
            {letter}
          </button>
        ))}
      </div>
      {done && (
        <button
          onClick={callbacks.onAdvance}
          style={{ minWidth: 140, minHeight: 52, fontSize: '1.1rem', borderRadius: 12, marginTop: 8, cursor: 'pointer', background: '#4A90E2', color: 'white', border: 'none' }}
        >
          {t('activities.introduce.nextButton')}
        </button>
      )}
    </div>
  );
}
