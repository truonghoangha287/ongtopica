import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfilePicker } from '@/shared/components/ProfilePicker';
import { useProfileStore } from '@/shared/store/profile-store';
import { wordSetRegistry } from '@/data/yle-starters/index';

export function HomePage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const [profilePicked, setProfilePicked] = useState(!!activeProfileId);

  if (!profilePicked) {
    return <ProfilePicker onProfileSelected={() => setProfilePicked(true)} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Ongtopica</h1>
        <button
          onClick={() => navigate('/settings')}
          style={{ minWidth: 48, minHeight: 48 }}
          aria-label={t('settings.title')}
        >
          ⚙️
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {wordSetRegistry.map((ws) => (
          <button
            key={ws.id}
            onClick={() => navigate(`/word-sets/${ws.id}`)}
            style={{ padding: 24, fontSize: '1.2rem', borderRadius: 16, minHeight: 100, cursor: 'pointer' }}
          >
            {t(`wordSets.${ws.id}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
