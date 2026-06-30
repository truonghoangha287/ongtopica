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
    <main className="page" style={{ maxWidth: 640 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
          ←
        </button>
        <h1 style={{ fontSize: '1.9rem', margin: 0 }}>🏅 {t('achievements.title')}</h1>
      </header>
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
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                border: isEarned ? '2px solid var(--accent)' : '2px solid transparent',
                opacity: isEarned ? 1 : 0.6,
              }}
            >
              <span
                aria-hidden="true"
                className="icon-btn"
                style={{ background: isEarned ? 'var(--secondary)' : 'var(--muted)', boxShadow: 'none' }}
              >
                {isEarned ? '🏅' : '🔒'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{t(nameKey)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-fg)' }}>
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
