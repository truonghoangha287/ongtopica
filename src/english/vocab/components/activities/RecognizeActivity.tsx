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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '64px 24px 32px' }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }}>{t('activities.recognize.prompt')}</p>
      <AudioPlayer src={word.audioAsset} autoPlay label={t('activities.recognize.prompt')} />
      <Mascot reaction={mascotReaction} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 420 }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            className="card"
            onClick={() => handleTap(opt)}
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 130,
              padding: 12,
              outline: revealedId === opt.id ? '3px solid var(--primary)' : 'none',
              outlineOffset: 2,
              cursor: done ? 'default' : 'pointer',
            }}
          >
            <img src={opt.pictureAsset} alt={opt.text} style={{ maxWidth: '100%', maxHeight: 96, objectFit: 'contain' }} />
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
