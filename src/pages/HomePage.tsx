import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfilePicker } from '@/shared/components/ProfilePicker';
import { useProfileStore } from '@/shared/store/profile-store';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { HomeProgressTile } from '@/english/vocab/components/home-progress-tile';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { mathTopicRegistry } from '@/data/math-starters/index';
import { mathTopicIcon } from '@/data/math-starters/icons';
import { isTopicUnlocked, masteredCount } from '@/math/services/topic-progression';
import { db } from '@/shared/db/db';
import type { WordProgressRow, ChildProfileRow } from '@/shared/db/schema';
import type { MathProgressMap } from '@/math/types/math.types';

const AVATARS = ['🐶', '🐱', '🐻', '🦊', '🐸', '🦁', '🐯', '🐼'];
const LEVELS = ['Starters', 'Movers', 'Flyers'] as const;
type Subject = 'english' | 'math';

export function HomePage() {
  const { t } = useTranslation('vocab');
  const { t: tMath } = useTranslation('math');
  const navigate = useNavigate();
  const activeProfileId = useProfileStore((s) => s.activeProfileId);
  const [profilePicked, setProfilePicked] = useState(!!activeProfileId);
  const [profile, setProfile] = useState<ChildProfileRow | null>(null);
  const wordProgressHook = useWordProgress();
  const mathProgressHook = useMathProgress();
  const [subject, setSubject] = useState<Subject>('english');
  // progressBySet: wordSetId → { wordId → WordProgressRow }
  const [progressBySet, setProgressBySet] = useState<
    Record<string, Record<string, WordProgressRow>>
  >({});
  // mathProgress: problemId → MathProgressRow
  const [mathProgress, setMathProgress] = useState<MathProgressMap>({});

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
    mathProgressHook.getAllProgress().then((rows) => {
      setMathProgress(Object.fromEntries(rows.map((r) => [r.problemId, r])));
    });
  }, [profilePicked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profilePicked) {
    return <ProfilePicker onProfileSelected={() => setProfilePicked(true)} />;
  }

  const avatarEmoji = profile ? AVATARS[Number(profile.avatarId) % AVATARS.length] : '🦉';

  return (
    <div className="page">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            aria-hidden="true"
            className="icon-btn"
            style={{ background: 'radial-gradient(circle at 50% 35%, var(--secondary), oklch(92% 0.05 70))', fontSize: '1.6rem' }}
          >
            {avatarEmoji}
          </span>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', fontWeight: 700 }}>
              {t('profiles.greeting', 'Hello,')}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{profile?.name ?? 'Ongtopica'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="icon-btn" onClick={() => navigate('/achievements')} aria-label={t('achievements.title')}>
            🏅
          </button>
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label={t('settings.title')}>
            ⚙️
          </button>
        </div>
      </header>

      {/* Subject switcher — English vs Math (Constitution VI: subjects are separate). */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div className="segmented" role="tablist" aria-label={tMath('home.mathTitle')}>
          <button
            className={`seg-btn${subject === 'english' ? ' active' : ''}`}
            role="tab"
            aria-selected={subject === 'english'}
            onClick={() => setSubject('english')}
          >
            📚 {tMath('subject.english')}
          </button>
          <button
            className={`seg-btn${subject === 'math' ? ' active' : ''}`}
            role="tab"
            aria-selected={subject === 'math'}
            onClick={() => setSubject('math')}
          >
            🔢 {tMath('subject.math')}
          </button>
        </div>
      </div>

      {subject === 'english' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div className="segmented" role="tablist" aria-label="Levels">
              {LEVELS.map((lvl, i) => (
                <button
                  key={lvl}
                  className={`seg-btn${i === 0 ? ' active' : ''}`}
                  role="tab"
                  aria-selected={i === 0}
                  disabled={i !== 0}
                >
                  {lvl}{i !== 0 && ' 🔒'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {wordSetRegistry.map((ws) => (
              <button
                key={ws.id}
                className="card"
                onClick={() => navigate(`/word-sets/${ws.id}`)}
                style={{
                  padding: 18,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>{wordSetIcon(ws.id)}</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t(`wordSets.${ws.id}`)}</span>
                <HomeProgressTile wordSet={ws} progressMap={progressBySet[ws.id] ?? {}} />
              </button>
            ))}
          </div>
        </>
      )}

      {subject === 'math' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {mathTopicRegistry.map((topic, i) => {
            const unlocked = isTopicUnlocked(i, mathTopicRegistry, mathProgress);
            const total = topic.problems.length;
            const mastered = masteredCount(topic, mathProgress);
            return (
              <button
                key={topic.id}
                className="card"
                onClick={() => navigate(`/math/${topic.id}`)}
                aria-label={
                  unlocked
                    ? tMath(`topics.${topic.id}`)
                    : `${tMath(`topics.${topic.id}`)} — ${tMath('home.lockedTopic')}`
                }
                style={{
                  padding: 18,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 8,
                  textAlign: 'left',
                  opacity: unlocked ? 1 : 0.6,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>
                  {unlocked ? mathTopicIcon(topic.id) : '🔒'}
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{tMath(`topics.${topic.id}`)}</span>
                <span className="badge">
                  {tMath('topicPage.masteredIndicator', { mastered, total })}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
