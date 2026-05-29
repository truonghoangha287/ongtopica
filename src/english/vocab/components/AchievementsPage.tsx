import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAchievements } from '@/english/vocab/hooks/useAchievements';
import { achievementLabel } from '@/english/vocab/services/achievement-evaluator';
import { ACHIEVEMENT_IDS } from '@/shared/constants/game-constants';
import { wordSetRegistry } from '@/data/yle-starters/index';
import type { AchievementRow } from '@/shared/db/schema';

/** Full catalog of all possible achievement IDs in display order. */
function buildCatalog(): string[] {
  const ids: string[] = [ACHIEVEMENT_IDS.FIRST_LISTEN];
  for (const ws of wordSetRegistry) {
    ids.push(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:${ws.id}`);
    ids.push(`${ACHIEVEMENT_IDS.SHARP_EYE}:${ws.id}`);
    ids.push(`${ACHIEVEMENT_IDS.WORD_BUILDER}:${ws.id}`);
    ids.push(`${ACHIEVEMENT_IDS.SET_MASTER}:${ws.id}`);
  }
  return ids;
}

const CATALOG = buildCatalog();

export function AchievementsPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { getEarned } = useAchievements();
  const [earned, setEarned] = useState<AchievementRow[]>([]);

  useEffect(() => {
    getEarned().then(setEarned);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const earnedMap = new Map(earned.map((a) => [a.achievementId, a]));

  return (
    <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ minWidth: 48, minHeight: 48, marginBottom: 16 }}
        aria-label={t('settings.backButton')}
      >
        ←
      </button>
      <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>{t('achievements.title')}</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CATALOG.map((achievementId) => {
          const row = earnedMap.get(achievementId);
          const isEarned = !!row;
          const { nameKey, hintKey } = achievementLabel(achievementId);
          const earnedDate = row
            ? new Date(row.earnedAt).toLocaleDateString()
            : null;

          return (
            <li
              key={achievementId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: '2px solid',
                borderColor: isEarned ? '#f5a623' : '#e0e0e0',
                background: isEarned ? '#fff9e6' : '#fafafa',
                opacity: isEarned ? 1 : 0.65,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>
                {isEarned ? '🏅' : '🔒'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: isEarned ? '#333' : '#999' }}>
                  {t(nameKey)}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#777' }}>
                  {isEarned
                    ? t('achievements.earnedOn', { date: earnedDate })
                    : t(hintKey)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
