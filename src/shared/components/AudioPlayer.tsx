import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAudio } from '@/shared/hooks/useAudio';

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  label?: string;
}

export function AudioPlayer({ src, autoPlay = false, label }: AudioPlayerProps) {
  const { t } = useTranslation('vocab');
  const { play, isPlaying, hasError } = useAudio();

  useEffect(() => {
    if (autoPlay) play(src);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always show a big, friendly speaker the child can tap — even if autoplay was
  // blocked. When it failed, pulse it so a pre-reader knows to tap for sound.
  return (
    <motion.button
      onClick={() => play(src)}
      aria-label={label ?? t('activities.introduce.replayButton')}
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
  );
}
