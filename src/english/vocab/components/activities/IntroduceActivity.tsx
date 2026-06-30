import { useTranslation } from 'react-i18next';
import { WordCard } from '@/english/vocab/components/WordCard';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import type { IntroduceActivityProps } from '@/english/vocab/types/vocab.types';

export function IntroduceActivity({ word, onComplete }: IntroduceActivityProps) {
  const { t } = useTranslation('vocab');
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
      <WordCard word={word} />
      <AudioPlayer src={word.audioAsset} autoPlay />
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
