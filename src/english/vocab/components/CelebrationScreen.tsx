import { useTranslation } from 'react-i18next';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { Mascot } from '@/shared/components/Mascot';
import type { ReactNode } from 'react';

interface CelebrationScreenProps {
  onDone: () => void;
  onPlayAgain?: () => void;
  banner?: ReactNode;
}

export function CelebrationScreen({ onDone, onPlayAgain, banner }: CelebrationScreenProps) {
  const { t } = useTranslation('vocab');
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
      <CelebrationEffect active />
      <Mascot reaction="celebrate" />
      <h2 style={{ fontSize: '2.6rem', margin: 0 }}>{t('session.celebration')}</h2>
      {banner}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, width: '100%', maxWidth: 260 }}>
        {onPlayAgain && (
          <button
            className="btn-primary"
            onClick={onPlayAgain}
            style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
          >
            🔁 {t('session.playAgain')}
          </button>
        )}
        <button
          className="btn-accent"
          onClick={onDone}
          style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          {t('session.exitButton')}
        </button>
      </div>
    </div>
  );
}
