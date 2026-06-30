import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { WordCard } from '@/english/vocab/components/WordCard';
import { useAudio } from '@/shared/hooks/useAudio';
import type { IntroduceActivityProps } from '@/english/vocab/types/vocab.types';

export function IntroduceActivity({ word, onComplete }: IntroduceActivityProps) {
  const { t } = useTranslation('vocab');
  const { play, isPlaying, hasError } = useAudio();

  // Auto-play on each new card; replays when the child taps the picture or speaker.
  useEffect(() => {
    play(word.audioAsset);
  }, [word.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        padding: '64px 24px 32px',
      }}
    >
      <p style={{ fontSize: '1rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }}>
        {t('activities.introduce.prompt')}
      </p>

      {/* Pop each new card in so the sequence feels lively, not repetitive. */}
      <motion.div
        key={word.id}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <WordCard
          word={word}
          onReplay={() => play(word.audioAsset)}
          replayLabel={t('activities.introduce.replayButton')}
        />
      </motion.div>

      <motion.button
        onClick={() => play(word.audioAsset)}
        aria-label={t('activities.introduce.replayButton')}
        disabled={isPlaying}
        animate={hasError && !isPlaying ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.9, repeat: hasError && !isPlaying ? Infinity : 0 }}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 72,
          height: 72,
          borderRadius: 9999,
          fontSize: '1.8rem',
          background: 'var(--primary)',
          color: 'var(--primary-fg)',
          boxShadow: 'var(--shadow-pop)',
          opacity: isPlaying ? 0.85 : 1,
        }}
      >
        {isPlaying ? '🔊' : '🔈'}
      </motion.button>

      <button
        className="btn-accent"
        onClick={onComplete}
        style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
      >
        <span>{t('activities.introduce.nextButton')}</span> <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
