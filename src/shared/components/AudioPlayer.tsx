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
        style={{ minWidth: 48, minHeight: 48 }}
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
      style={{ minWidth: 48, minHeight: 48, fontSize: '1.5rem' }}
    >
      {isPlaying ? '🔊' : '▶️'}
    </button>
  );
}
