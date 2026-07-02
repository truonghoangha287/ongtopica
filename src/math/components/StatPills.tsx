import { useTranslation } from 'react-i18next';

interface StatPillsProps {
  honey: number;
  streak: number;
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '8px 12px',
  borderRadius: 9999,
  background: 'var(--paper)',
  boxShadow: 'var(--shadow-card)',
  fontWeight: 900,
  fontSize: '0.9rem',
};

const numStyle: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

/** Honey wallet + daily streak pills shown in the Math World header. */
export function StatPills({ honey, streak }: StatPillsProps) {
  const { t } = useTranslation('math');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={pillStyle} aria-label={t('aria.honey', { count: honey })}>
        <span aria-hidden="true">🍯</span>
        <span style={numStyle}>{honey}</span>
      </span>
      <span style={pillStyle} aria-label={t('aria.streak', { count: streak })}>
        <span aria-hidden="true">🔥</span>
        <span style={numStyle}>{streak}</span>
      </span>
    </div>
  );
}
