import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { MAX_RETRIES } from '@/shared/constants/game-constants';
import type { RecognizeActivityProps } from '@/english/vocab/types/vocab.types';
import type { Word } from '@/shared/types';

export function RecognizeActivity({ word, distractors, callbacks }: RecognizeActivityProps) {
  const { t } = useTranslation('vocab');
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [retries, setRetries] = useState(0);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const options: Word[] = useMemo(
    () => [...distractors, word].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word.id]
  );

  const handleTap = (tapped: Word) => {
    if (done) return;
    if (tapped.id === word.id) {
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
      setRevealedId(word.id);
      setDone(true);
      callbacks.onReveal();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1.2rem' }}>{t('activities.recognize.prompt')}</p>
      <AudioPlayer src={word.audioAsset} autoPlay label={t('activities.recognize.prompt')} />
      <Mascot reaction={mascotReaction} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 400 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleTap(opt)}
            style={{
              minHeight: 120,
              borderRadius: 12,
              padding: 8,
              border: revealedId === opt.id ? '3px solid #4A90E2' : '2px solid #ddd',
              cursor: done ? 'default' : 'pointer',
            }}
          >
            <img src={opt.pictureAsset} alt={opt.text} style={{ width: '100%', borderRadius: 8 }} />
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
