import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTopic } from '@/math/data/topics';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { TOPIC_LEVEL_COUNT } from '@/math/constants/math-constants';
import { BeeMascot } from '@/math/components/BeeMascot';

/** Small round journey node (locked / cleared). */
function Node({ left, top, children, label, stars }: { left: number; top: number; children: React.ReactNode; label?: string; stars?: number }) {
  const { t } = useTranslation('math');
  return (
    <div style={{ position: 'absolute', top, left: '50%', transform: `translate(${left}px, 0)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 62, height: 62, borderRadius: 9999, background: stars != null ? 'var(--success)' : '#fff', color: stars != null ? '#fff' : undefined, boxShadow: stars != null ? '0 8px 16px -10px rgba(40,120,70,.6)' : '0 6px 16px -10px rgba(80,60,30,.3)', fontSize: '1.5rem', opacity: stars == null && label == null ? 0.6 : 1 }}>
        {children}
      </span>
      {stars != null && (
        <span aria-label={t('journey.clearedAria', { stars })} style={{ fontSize: '0.7rem', color: 'var(--star)', letterSpacing: '1px' }}>
          {'★★★'.slice(0, stars)}
        </span>
      )}
      {label && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-fg)' }}>{label}</span>}
    </div>
  );
}

/** The winding level path for one topic. The pulsing START node opens the quiz. */
export function TopicJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const topic = id ? getTopic(id) : undefined;
  const { getTopicProgress, getEconomy } = useMathProgress();
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!topic) return;
    getTopicProgress().then((p) => setLevel(p[topic.id]?.level ?? 1));
    getEconomy().then((e) => setStreak(e.streak));
  }, [topic?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return <div style={{ padding: 24 }}>Topic not found.</div>;

  const pct = Math.min(100, Math.round((level / TOPIC_LEVEL_COUNT) * 100));
  const startQuiz = () => navigate(`/math/quiz/${topic.id}`);

  return (
    <div className="page math-world">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('journey.backAria')}>←</button>
          <h1 style={{ fontSize: '1.3rem', margin: 0 }}>
            <span aria-hidden="true">{topic.icon} </span>{t(topic.nameKey)}
          </h1>
        </div>
        <span className="badge" style={{ background: 'var(--paper)', boxShadow: 'var(--shadow-card)', fontWeight: 900 }}>
          <span aria-hidden="true">🔥</span> {streak}
        </span>
      </header>

      <div className="progress" style={{ background: 'var(--ma-soft)', marginBottom: 5 }}>
        <i style={{ width: `${pct}%`, background: 'var(--ma)' }} />
      </div>
      <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--muted-fg)', fontWeight: 800, textAlign: 'center' }}>
        {t('journey.levelProgress', { level, total: TOPIC_LEVEL_COUNT })}
      </p>

      <div style={{ position: 'relative', height: 520, margin: '4px auto 0', maxWidth: 360 }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 16, bottom: 8, width: 0, borderLeft: '4px dashed var(--ma-soft)', transform: 'translateX(-2px)' }} />

        {/* Boss reward (top, locked) */}
        <Node left={0} top={0} label={t('journey.boss')}>
          <span style={{ fontSize: '1.9rem', opacity: 0.7 }}>🎁</span>
        </Node>
        <Node left={30} top={100}>🔒</Node>
        <Node left={-92} top={184}>🔒</Node>

        {/* Current level — the START node */}
        <div style={{ position: 'absolute', top: 256, left: '50%', transform: 'translate(28px, 0)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <button
            className="ma-pulse-ring"
            onClick={startQuiz}
            aria-label={t('journey.startAria', { name: t(topic.nameKey), level })}
            style={{ display: 'grid', placeItems: 'center', width: 84, height: 84, borderRadius: 9999, background: 'var(--ma)', color: '#fff', fontSize: '2rem', boxShadow: '0 12px 24px -10px var(--ma)' }}
          >
            ⭐
          </button>
          <button onClick={startQuiz} style={{ padding: '5px 16px', borderRadius: 9999, background: 'var(--ma)', color: '#fff', fontWeight: 900, fontSize: '0.82rem', boxShadow: '0 8px 16px -10px var(--ma)' }}>
            {t('journey.start')}
          </button>
          <span style={{ position: 'absolute', left: 82, top: -4, pointerEvents: 'none' }}>
            <BeeMascot size={30} float />
          </span>
        </div>

        {/* Cleared levels below (stars reflect best mastery) */}
        <Node left={-96} top={366} stars={3}>✓</Node>
        <Node left={22} top={444} stars={2}>✓</Node>
      </div>
    </div>
  );
}
