import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import type { ChildProfileRow } from '@/shared/db/schema';

const AVATARS = ['🐶', '🐱', '🐻', '🦊', '🐸', '🦁', '🐯', '🐼'];

interface ProfilePickerProps {
  onProfileSelected: () => void;
}

export function ProfilePicker({ onProfileSelected }: ProfilePickerProps) {
  const { t } = useTranslation('vocab');
  const [profiles, setProfiles] = useState<ChildProfileRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatarIdx, setNewAvatarIdx] = useState(0);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);

  useEffect(() => {
    db.childProfiles.orderBy('createdAt').toArray().then(setProfiles);
  }, []);

  const handleSelect = (profile: ChildProfileRow) => {
    setActiveProfile(profile.id);
    onProfileSelected();
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const id = crypto.randomUUID();
    await db.childProfiles.add({
      id,
      name: newName.trim(),
      avatarId: String(newAvatarIdx),
      createdAt: Date.now(),
    });
    setProfiles(await db.childProfiles.orderBy('createdAt').toArray());
    setAdding(false);
    setNewName('');
  };

  return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: '2rem' }}>{t('profiles.selectProfile')}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', margin: '24px 0' }}>
        {profiles.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelect(p)}
            style={{ width: 100, height: 100, fontSize: '3rem', borderRadius: 16, cursor: 'pointer' }}
            aria-label={p.name}
          >
            {AVATARS[Number(p.avatarId) % AVATARS.length]}
            <div style={{ fontSize: '0.9rem', marginTop: 4 }}>{p.name}</div>
          </button>
        ))}
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{ width: 100, height: 100, fontSize: '2rem', borderRadius: 16 }}
          >
            +<div style={{ fontSize: '0.8rem' }}>{t('profiles.addProfile')}</div>
          </button>
        )}
      </div>
      {adding && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            style={{ fontSize: '1.2rem', padding: '8px 16px', borderRadius: 8 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {AVATARS.map((a, i) => (
              <button
                key={i}
                onClick={() => setNewAvatarIdx(i)}
                style={{
                  fontSize: '2rem',
                  background: i === newAvatarIdx ? '#4A90E2' : 'transparent',
                  borderRadius: 8,
                  minWidth: 48,
                  minHeight: 48,
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} style={{ minWidth: 120, minHeight: 48 }}>
            {t('profiles.addProfile')}
          </button>
        </div>
      )}
    </div>
  );
}
