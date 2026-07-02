import { useTranslation } from 'react-i18next';
import { MATH_QUIZZES } from '@/math/data/quizzes';
import { TIMO_UNLOCK_STARS } from '@/math/constants/math-constants';

interface BeeOlympiadProps {
  /** Puzzles already cleared in today's challenge (0–3), from patterns mastery. */
  challengeDone: number;
  onStart: () => void;
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  padding: '13px 14px',
  borderRadius: 16,
};

/** The competition pillar — daily challenge banner + Olympiad tracks. */
export function BeeOlympiad({ challengeDone, onStart }: BeeOlympiadProps) {
  const { t } = useTranslation('math');
  const total = MATH_QUIZZES.patterns.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{t('hub.beeOlympiad').replace('🏆 ', '')}</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.86rem' }}>
            {t('olympiad.subtitle')}
          </p>
        </div>
        <span className="badge" style={{ background: 'var(--paper)', boxShadow: 'var(--shadow-card)', fontWeight: 900 }}>
          {t('olympiad.rank', { rank: t('olympiad.rankWorkerBee') })}
        </span>
      </div>

      {/* Daily challenge banner */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          padding: 18,
          marginBottom: 14,
          background: 'linear-gradient(135deg, var(--ma) 0%, oklch(70% 0.15 55) 100%)',
          color: '#fff',
          boxShadow: '0 18px 34px -18px var(--ma)',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.03em', marginBottom: 8 }}>
          <span style={{ padding: '3px 9px', borderRadius: 9999, background: 'rgba(255,255,255,.25)' }}>
            {t('olympiad.dailyChallenge')}
          </span>
        </div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, lineHeight: 1.15, marginBottom: 4 }}>
          {t('olympiad.puzzlesToday', { count: total })}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, opacity: 0.92, marginBottom: 14 }}>
          {t('olympiad.challengeDesc')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 5 }} aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--ma-ink)',
                  fontWeight: 900,
                  background: i < challengeDone ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)',
                }}
              >
                {i < challengeDone ? '✓' : ''}
              </span>
            ))}
          </div>
          <button
            className="ma-lift"
            onClick={onStart}
            style={{ padding: '11px 24px', borderRadius: 9999, background: '#fff', color: 'var(--ma-ink)', fontWeight: 900, fontSize: '0.9rem', boxShadow: '0 8px 16px -8px rgba(0,0,0,.3)' }}
          >
            {t('olympiad.start')}
          </button>
        </div>
        <span aria-hidden="true" style={{ position: 'absolute', right: -6, top: -6, fontSize: '3.4rem', opacity: 0.28, transform: 'rotate(12deg)' }}>🏆</span>
      </div>

      <p style={{ margin: '0 0 8px', fontWeight: 900, fontSize: '0.76rem', color: 'var(--muted-fg)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {t('olympiad.tracksHeading')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="card ma-lift" onClick={onStart} style={{ ...cardStyle, width: '100%', textAlign: 'left' }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 9999, background: 'conic-gradient(var(--ma) 0 62%, var(--ma-soft) 62% 100%)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9999, background: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>🦘</span>
          </span>
          <span style={{ flex: 1, lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontWeight: 900, fontSize: '0.98rem' }}>{t('olympiad.kangaroo')}</span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted-fg)', fontWeight: 700 }}>{t('olympiad.kangarooDesc')}</span>
          </span>
          <span aria-hidden="true" style={{ color: 'var(--ma-ink)', fontWeight: 900 }}>→</span>
        </button>

        <button className="card ma-lift" onClick={onStart} style={{ ...cardStyle, width: '100%', textAlign: 'left' }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 9999, background: 'conic-gradient(var(--primary) 0 38%, var(--ma-soft) 38% 100%)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9999, background: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.1rem' }}>🧠</span>
          </span>
          <span style={{ flex: 1, lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontWeight: 900, fontSize: '0.98rem' }}>{t('olympiad.sasmo')}</span>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted-fg)', fontWeight: 700 }}>{t('olympiad.sasmoDesc')}</span>
          </span>
          <span aria-hidden="true" style={{ color: 'var(--ma-ink)', fontWeight: 900 }}>→</span>
        </button>

        <div style={{ ...cardStyle, background: 'oklch(96% 0.008 85)', opacity: 0.7 }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: 9999, background: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: '1.2rem' }}>🔒</span>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--muted-fg)' }}>{t('olympiad.timo')}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted-fg)', fontWeight: 700 }}>{t('olympiad.timoLocked', { count: TIMO_UNLOCK_STARS })}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
