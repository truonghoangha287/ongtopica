import { useTranslation } from 'react-i18next';
import { Mascot } from '@/shared/components/Mascot';

interface OutOfHeartsScreenProps {
  /** Restart the same session from the first item with a fresh heart pool. */
  onTryAgain: () => void;
  onGoHome: () => void;
}

/**
 * Shown when the last heart is spent. Deliberately gentle: no confetti, no
 * score, no "you lost" — every star already earned is kept.
 */
export function OutOfHeartsScreen({ onTryAgain, onGoHome }: OutOfHeartsScreenProps) {
  const { t } = useTranslation('vocab');
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center' }}>
      <Mascot reaction="encourage" />
      <h2 style={{ fontSize: '2.4rem', margin: 0 }}>{t('session.outOfHearts')}</h2>
      <p style={{ fontSize: '1.1rem', color: 'var(--muted-fg)', margin: 0, maxWidth: 320 }}>
        {t('session.outOfHeartsBody')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, width: '100%', maxWidth: 260 }}>
        <button
          className="btn-primary"
          onClick={onTryAgain}
          style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          🔁 {t('session.tryAgain')}
        </button>
        <button
          className="btn-accent"
          onClick={onGoHome}
          style={{ minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          {t('session.goHome')}
        </button>
      </div>
    </div>
  );
}
