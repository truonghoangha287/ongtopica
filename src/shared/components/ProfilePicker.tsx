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

  const avatarCircle = (emoji: string) => (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 84,
        height: 84,
        borderRadius: 9999,
        fontSize: '2.6rem',
        background: 'radial-gradient(circle at 50% 35%, var(--secondary), oklch(92% 0.05 70))',
      }}
    >
      {emoji}
    </span>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>🦉</div>
      <h1 style={{ fontSize: '2.8rem', margin: '8px 0 4px' }}>Ongtopica</h1>
      <p style={{ color: 'var(--accent)', fontWeight: 700, margin: '0 0 28px' }}>
        {t('profiles.selectProfile')}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center' }}>
        {profiles.map((p) => (
          <button
            key={p.id}
            className="card"
            onClick={() => handleSelect(p)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              width: 168,
              padding: '28px 16px',
            }}
            aria-label={p.name}
          >
            {avatarCircle(AVATARS[Number(p.avatarId) % AVATARS.length])}
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{p.name}</span>
          </button>
        ))}
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: 168,
              padding: '28px 16px',
              background: 'transparent',
              border: '2px dashed var(--border)',
              color: 'var(--muted-fg)',
              boxShadow: 'none',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 84,
                height: 84,
                borderRadius: 9999,
                fontSize: '2.4rem',
                color: 'var(--primary)',
                background: 'var(--secondary)',
              }}
            >
              +
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t('profiles.addProfile')}</span>
          </button>
        )}
      </div>

      {adding && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', marginTop: 24, padding: 20 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            style={{ fontSize: '1.2rem', padding: '10px 16px', borderRadius: 12, textAlign: 'center' }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {AVATARS.map((a, i) => (
              <button
                key={i}
                onClick={() => setNewAvatarIdx(i)}
                aria-pressed={i === newAvatarIdx}
                style={{
                  fontSize: '1.8rem',
                  background: i === newAvatarIdx ? 'var(--primary)' : 'var(--secondary)',
                  borderRadius: 12,
                  width: 52,
                  height: 52,
                  boxShadow: i === newAvatarIdx ? 'var(--shadow-pop)' : 'none',
                }}
              >
                {a}
              </button>
            ))}
          </div>
          <button className="btn-accent" onClick={handleAdd} style={{ minWidth: 160, minHeight: 48, fontSize: '1.05rem' }}>
            {t('profiles.addProfile')}
          </button>
        </div>
      )}
    </div>
  );
}
