import { useTranslation } from 'react-i18next';
import { WordCard } from '@/english/vocab/components/WordCard';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import type { IntroduceActivityProps } from '@/english/vocab/types/vocab.types';

export function IntroduceActivity({ word, onComplete }: IntroduceActivityProps) {
  const { t } = useTranslation('vocab');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
      <p style={{ fontSize: '1.2rem' }}>{t('activities.introduce.prompt')}</p>
      <WordCard word={word} />
      <AudioPlayer src={word.audioAsset} autoPlay />
      <button
        onClick={onComplete}
        style={{ minWidth: 120, minHeight: 48, fontSize: '1.1rem', marginTop: 16 }}
      >
        {t('activities.introduce.nextButton')}
      </button>
    </div>
  );
}
