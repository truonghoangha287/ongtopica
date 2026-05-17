import { useTranslation } from 'react-i18next';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { Mascot } from '@/shared/components/Mascot';
import type { ReactNode } from 'react';

interface CelebrationScreenProps {
  onDone: () => void;
  banner?: ReactNode;
}

export function CelebrationScreen({ onDone, banner }: CelebrationScreenProps) {
  const { t } = useTranslation('vocab');
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <CelebrationEffect active />
      <Mascot reaction="celebrate" />
      <h2 style={{ fontSize: '2.5rem' }}>{t('session.celebration')}</h2>
      {banner}
      <button
        onClick={onDone}
        style={{ minWidth: 120, minHeight: 48, marginTop: 24, fontSize: '1.1rem' }}
      >
        {t('session.exitButton')}
      </button>
    </div>
  );
}
