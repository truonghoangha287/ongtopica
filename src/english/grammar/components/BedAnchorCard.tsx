import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface BedAnchorCardProps {
  onDismiss: () => void;
}

/**
 * The b/d mnemonic, shown before the first b/d round and reachable from the
 * hint button afterwards. Teaching one physical anchor fixes the cause; drilling
 * alone only rehearses the symptom.
 */
export function BedAnchorCard({ onDismiss }: BedAnchorCardProps) {
  const { t } = useTranslation('vocab');

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        borderRadius: 24,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
        {t('grammar.bedAnchor.title')}
      </h2>

      <div
        role="img"
        aria-label={t('grammar.bedAnchor.handsAlt')}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          fontSize: '3.2rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}
      >
        <span style={{ color: 'var(--primary)' }}>b</span>
        <span style={{ color: 'var(--muted-fg)' }}>e</span>
        <span style={{ color: 'var(--accent, var(--destructive))' }}>d</span>
      </div>

      <p style={{ fontWeight: 700, color: 'var(--muted-fg)', margin: 0, maxWidth: 320 }}>
        {t('grammar.bedAnchor.body')}
      </p>

      <button
        className="btn-primary"
        onClick={onDismiss}
        style={{ minHeight: 52, padding: '0 32px' }}
      >
        {t('grammar.bedAnchor.gotIt')}
      </button>
    </motion.div>
  );
}
