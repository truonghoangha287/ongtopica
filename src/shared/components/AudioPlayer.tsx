import { useEffect } from 'react';
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

  if (hasError) {
    return (
      <button
        onClick={() => play(src)}
        aria-label={t('errors.audioUnavailable')}
        style={{ minHeight: 48, padding: '0 16px', background: 'var(--muted)', color: 'var(--muted-fg)' }}
      >
        🔇 {t('errors.audioUnavailable')}
      </button>
    );
  }

  return (
    <button
      onClick={() => play(src)}
      aria-label={label ?? t('activities.introduce.replayButton')}
      disabled={isPlaying}
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
    </button>
  );
}
