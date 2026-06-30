import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { MAX_RETRIES } from '@/shared/constants/game-constants';
import type { ListenMatchActivityProps } from '@/english/vocab/types/vocab.types';
import type { Word } from '@/shared/types';

/**
 * Listen & Match — hear a word (TTS) and tap its picture among several hotspots.
 * Like Recognize but Listening-section practice with a larger board. One gentle
 * retry, then the correct hotspot is revealed before advancing.
 */
export function ListenMatchActivity({ word, distractors, callbacks }: ListenMatchActivityProps) {
  const { t } = useTranslation('vocab');
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [retries, setRetries] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const options: Word[] = useMemo(
    () => [...distractors, word].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [word.id],
  );

  const handleTap = (tapped: Word) => {
    if (done) return;
    if (tapped.id === word.id) {
      setMascotReaction('celebrate');
      setCelebrating(true);
      setRevealedId(word.id);
      setDone(true);
      callbacks.onCorrect();
    } else if (retries < MAX_RETRIES) {
      setRetries((r) => r + 1);
      setWrongId(tapped.id);
      setMascotReaction('encourage');
      callbacks.onIncorrect();
      setTimeout(() => {
        setMascotReaction('idle');
        setWrongId(null);
      }, 700);
    } else {
      setRevealedId(word.id);
      setDone(true);
      callbacks.onReveal();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '64px 24px 32px' }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }}>
        {t('activities.listenMatch.prompt')}
      </p>
      <AudioPlayer src={word.audioAsset} autoPlay label={t('activities.listenMatch.replayButton')} />
      <Mascot reaction={mascotReaction} />
      <div
        role="group"
        aria-label={t('activities.listenMatch.prompt')}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 460 }}
      >
        {options.map((opt) => {
          const isRevealed = revealedId === opt.id;
          const isWrong = wrongId === opt.id;
          return (
            <motion.button
              key={opt.id}
              className="card"
              onClick={() => handleTap(opt)}
              animate={isWrong ? { x: [0, -6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.35 }}
              aria-label={opt.text}
              style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 100,
                padding: 10,
                outline: isRevealed ? '3px solid var(--success)' : 'none',
                outlineOffset: 2,
                opacity: done && !isRevealed ? 0.45 : 1,
                cursor: done ? 'default' : 'pointer',
              }}
            >
              <img src={opt.pictureAsset} alt={opt.text} style={{ maxWidth: '100%', maxHeight: 72, objectFit: 'contain' }} />
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
