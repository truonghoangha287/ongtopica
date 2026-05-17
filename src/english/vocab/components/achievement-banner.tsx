import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { achievementLabel } from '@/english/vocab/services/achievement-evaluator';

interface AchievementBannerProps {
  achievementIds: string[];
}

/**
 * One-shot in-celebration banner that animates in newly earned achievement badges.
 * Renders nothing when achievementIds is empty.
 */
export function AchievementBanner({ achievementIds }: AchievementBannerProps) {
  const { t } = useTranslation('vocab');

  if (achievementIds.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('achievements.title')}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 16 }}
    >
      <AnimatePresence>
        {achievementIds.map((id, idx) => {
          const { nameKey } = achievementLabel(id);
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.15, type: 'spring', stiffness: 260, damping: 20 }}
              style={{
                background: '#fff9e6',
                border: '2px solid #f5a623',
                borderRadius: 12,
                padding: '8px 20px',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span aria-hidden="true">🏅</span>
              {t(nameKey)}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
