import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfilePicker } from '@/shared/components/ProfilePicker';
import { useProfileStore } from '@/shared/store/profile-store';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { EnglishHome } from '@/english/vocab/components/EnglishHome';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import type { MathEconomy } from '@/math/hooks/useMathProgress';
import { MathHub } from '@/math/components/MathHub';
import { StatPills } from '@/math/components/StatPills';
import { db } from '@/shared/db/db';
import type { WordProgressRow, ChildProfileRow } from '@/shared/db/schema';

const AVATARS = ['🐶', '🐱', '🐻', '🦊', '🐸', '🦁', '🐯', '🐼'];
type Subject = 'english' | 'math';

export function HomePage() {
  const { t } = useTranslation('vocab');
  const { t: tm } = useTranslation('math');
  const navigate = useNavigate();
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const [profilePicked, setProfilePicked] = useState(!!activeProfileId);
  const [profile, setProfile] = useState<ChildProfileRow | null>(null);
  const [subject, setSubject] = useState<Subject>('english');
  const [economy, setEconomy] = useState<MathEconomy>({ honey: 0, streak: 0, hivesToday: 0 });
  const wordProgressHook = useWordProgress();
  const { getEconomy } = useMathProgress();
  const [progressBySet, setProgressBySet] = useState<Record<string, Record<string, WordProgressRow>>>({});

  useEffect(() => {
    if (!profilePicked) return;
    if (activeProfileId) db.childProfiles.get(activeProfileId).then((p) => setProfile(p ?? null));
    wordProgressHook.getAllProgress().then((rows) => {
      const bySet: Record<string, Record<string, WordProgressRow>> = {};
      for (const row of rows) {
        if (!bySet[row.wordSetId]) bySet[row.wordSetId] = {};
        bySet[row.wordSetId][row.wordId] = row;
      }
      setProgressBySet(bySet);
    });
    getEconomy().then(setEconomy);
  }, [profilePicked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profilePicked) {
    return <ProfilePicker onProfileSelected={() => setProfilePicked(true)} />;
  }

  const avatarEmoji = profile ? AVATARS[Number(profile.avatarId) % AVATARS.length] : '🦉';
  const isMath = subject === 'math';

  const subjectTab = (key: Subject, label: string) => {
    const active = subject === key;
    const activeBg = key === 'math' ? 'var(--ma)' : 'var(--primary)';
    return (
      <button
        role="tab"
        aria-selected={active}
        onClick={() => setSubject(key)}
        style={{
          padding: '8px 18px',
          borderRadius: 9999,
          background: active ? activeBg : 'transparent',
          color: active ? '#fff' : 'var(--muted-fg)',
          fontWeight: active ? 900 : 800,
          fontSize: '0.88rem',
          boxShadow: active ? '0 8px 16px -8px rgba(80,60,30,.35)' : 'none',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={`page${isMath ? ' math-world' : ''}`}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span aria-hidden="true" className="icon-btn" style={{ background: isMath ? 'var(--ma-soft)' : 'radial-gradient(circle at 50% 35%, var(--secondary), oklch(92% 0.05 70))', fontSize: '1.6rem' }}>
            {isMath ? '🐝' : avatarEmoji}
          </span>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', fontWeight: 700 }}>{t('profiles.greeting', 'Hello,')}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile?.name ?? 'Ongtopica'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMath ? (
            <StatPills honey={economy.honey} streak={economy.streak} />
          ) : (
            <button className="icon-btn" onClick={() => navigate('/achievements')} aria-label={t('achievements.title')}>🏅</button>
          )}
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label={t('settings.title')}>⚙️</button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="segmented" role="tablist" aria-label="Subjects">
          {subjectTab('english', tm('subjectSwitch.english'))}
          {subjectTab('math', tm('subjectSwitch.math'))}
        </div>
      </div>

      {isMath ? <MathHub economy={economy} /> : <EnglishHome progressBySet={progressBySet} />}
    </div>
  );
}
