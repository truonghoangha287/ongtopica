import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTopic } from '@/math/data/topics';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import type { LevelResults } from '@/math/hooks/useMathProgress';
import { TOPIC_LEVEL_COUNT } from '@/math/constants/math-constants';
import { BeeMascot } from '@/math/components/BeeMascot';

/** Vertical rhythm of the journey path and the alternating horizontal weave. */
const NODE_SPACING = 84;
const X_WEAVE = [60, 0, -60, 0];

/** Small round journey node (cleared / locked). */
function Node({ y, x, children, label, stars, ariaLabel }: { y: number; x: number; children: React.ReactNode; label?: string; stars?: number; ariaLabel?: string }) {
  return (
    <div style={{ position: 'absolute', top: y, left: '50%', transform: `translate(${x}px, 0)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span aria-label={ariaLabel} role={ariaLabel ? 'img' : undefined} aria-hidden={ariaLabel ? undefined : true} style={{ display: 'grid', placeItems: 'center', width: 60, height: 60, borderRadius: 9999, background: stars != null ? 'var(--success)' : '#fff', color: stars != null ? '#fff' : undefined, boxShadow: stars != null ? '0 8px 16px -10px rgba(40,120,70,.6)' : '0 6px 16px -10px rgba(80,60,30,.3)', fontSize: '1.5rem', opacity: stars == null && label == null ? 0.6 : 1 }}>
        {children}
      </span>
      {stars != null && (
        <span aria-hidden="true" style={{ fontSize: '0.7rem', color: 'var(--star)', letterSpacing: '1px' }}>
          {'★★★'.slice(0, stars)}
        </span>
      )}
      {label && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-fg)' }}>{label}</span>}
    </div>
  );
}

/** The winding level path for one topic, rendered from real per-level results. */
export function TopicJourneyPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const topic = id ? getTopic(id) : undefined;
  const { getTopicProgress, getLevelResults, getEconomy } = useMathProgress();
  const [level, setLevel] = useState(1);
  const [results, setResults] = useState<LevelResults>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!topic) return;
    getTopicProgress().then((p) => setLevel(p[topic.id]?.level ?? 1));
    getLevelResults(topic.id).then(setResults);
    getEconomy().then((e) => setStreak(e.streak));
  }, [topic?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return <div style={{ padding: 24 }}>Topic not found.</div>;

  // The level the child plays next, clamped to the top of the ladder.
  const currentLevel = Math.min(level, TOPIC_LEVEL_COUNT);
  const allCleared = level > TOPIC_LEVEL_COUNT;
  const pct = Math.min(100, Math.round((Math.min(level, TOPIC_LEVEL_COUNT) / TOPIC_LEVEL_COUNT) * 100));
  const startQuiz = () => navigate(`/math/quiz/${topic.id}`);

  const pathHeight = (TOPIC_LEVEL_COUNT + 1) * NODE_SPACING + 40;
  // Level 12 sits just under the boss; level 1 at the bottom. Child climbs upward.
  const yFor = (lvl: number) => (TOPIC_LEVEL_COUNT - lvl + 1) * NODE_SPACING;
  const xFor = (lvl: number) => X_WEAVE[(lvl - 1) % X_WEAVE.length];

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
        {t('journey.levelProgress', { level: currentLevel, total: TOPIC_LEVEL_COUNT })}
      </p>

      <div style={{ position: 'relative', height: pathHeight, margin: '4px auto 0', maxWidth: 360 }}>
        <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 16, bottom: 8, width: 0, borderLeft: '4px dashed var(--ma-soft)', transform: 'translateX(-2px)' }} />

        {/* Boss reward at the very top — opens once every level is cleared. */}
        <Node y={0} x={0} label={t('journey.boss')}>
          <span style={{ fontSize: '1.9rem', opacity: allCleared ? 1 : 0.7 }}>{allCleared ? '🏆' : '🎁'}</span>
        </Node>

        {Array.from({ length: TOPIC_LEVEL_COUNT }, (_, i) => TOPIC_LEVEL_COUNT - i).map((lvl) => {
          const y = yFor(lvl);
          const x = xFor(lvl);

          if (!allCleared && lvl === currentLevel) {
            // The current level — the pulsing START node.
            return (
              <div key={lvl} style={{ position: 'absolute', top: y - 12, left: '50%', transform: `translate(${x}px, 0)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  className="ma-pulse-ring"
                  onClick={startQuiz}
                  aria-label={t('journey.startAria', { name: t(topic.nameKey), level: lvl })}
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
            );
          }

          if (allCleared || lvl < currentLevel) {
            // Cleared level — show the stars actually earned there.
            const stars = results[lvl] ?? 1;
            return <Node key={lvl} y={y} x={x} stars={stars} ariaLabel={t('journey.clearedAria', { stars })}>✓</Node>;
          }

          // Locked level ahead.
          return <Node key={lvl} y={y} x={x} ariaLabel={t('journey.lockedAria')}>🔒</Node>;
        })}
      </div>
    </div>
  );
}
