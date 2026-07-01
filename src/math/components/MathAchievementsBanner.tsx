import { useTranslation } from 'react-i18next';
import { MATH_ACHIEVEMENT_IDS } from '@/shared/constants/game-constants';

interface MathAchievementsBannerProps {
  achievementIds: string[];
}

/** Map an achievement id to its i18n name key in the math namespace. */
function nameKey(achievementId: string): string {
  if (achievementId === MATH_ACHIEVEMENT_IDS.FIRST_STEPS) return 'achievements.firstSteps';
  if (achievementId.startsWith(`${MATH_ACHIEVEMENT_IDS.TOPIC_MASTER}:`)) {
    const topicId = achievementId.split(':')[1];
    return `achievements.topicMaster.${topicId}`;
  }
  return 'achievements.generic';
}

/** One-shot banner shown on the celebration screen when new badges are earned. */
export function MathAchievementsBanner({ achievementIds }: MathAchievementsBannerProps) {
  const { t } = useTranslation('math');
  if (achievementIds.length === 0) return null;
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'var(--secondary)',
        color: 'var(--secondary-fg)',
        borderRadius: 'var(--radius)',
        padding: '12px 20px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <span style={{ fontWeight: 800 }}>🏅 {t('achievements.newBadge')}</span>
      {achievementIds.map((id) => (
        <span key={id} style={{ fontWeight: 700 }}>
          {t(nameKey(id), t('achievements.generic'))}
        </span>
      ))}
    </div>
  );
}
