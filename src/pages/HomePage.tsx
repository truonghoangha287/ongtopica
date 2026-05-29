import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfilePicker } from '@/shared/components/ProfilePicker';
import { useProfileStore } from '@/shared/store/profile-store';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { HomeProgressTile } from '@/english/vocab/components/home-progress-tile';
import { wordSetRegistry } from '@/data/yle-starters/index';
import type { WordProgressRow } from '@/shared/db/schema';

export function HomePage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const [profilePicked, setProfilePicked] = useState(!!activeProfileId);
  const wordProgressHook = useWordProgress();
  // progressBySet: wordSetId → { wordId → WordProgressRow }
  const [progressBySet, setProgressBySet] = useState<
    Record<string, Record<string, WordProgressRow>>
  >({});

  useEffect(() => {
    if (!profilePicked) return;
    wordProgressHook.getAllProgress().then((rows) => {
      const bySet: Record<string, Record<string, WordProgressRow>> = {};
      for (const row of rows) {
        if (!bySet[row.wordSetId]) bySet[row.wordSetId] = {};
        bySet[row.wordSetId][row.wordId] = row;
      }
      setProgressBySet(bySet);
    });
  }, [profilePicked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profilePicked) {
    return <ProfilePicker onProfileSelected={() => setProfilePicked(true)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Ongtopica</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/achievements')}
            style={{ minWidth: 48, minHeight: 48 }}
            aria-label={t('achievements.title')}
          >
            🏅
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{ minWidth: 48, minHeight: 48 }}
            aria-label={t('settings.title')}
          >
            ⚙️
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {wordSetRegistry.map((ws) => (
          <button
            key={ws.id}
            onClick={() => navigate(`/word-sets/${ws.id}`)}
            style={{
              padding: 24,
              fontSize: '1.2rem',
              borderRadius: 16,
              minHeight: 100,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{t(`wordSets.${ws.id}`)}</span>
            <HomeProgressTile wordSet={ws} progressMap={progressBySet[ws.id] ?? {}} />
          </button>
        ))}
      </div>
    </div>
  );
}
