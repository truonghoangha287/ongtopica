import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PRACTICE_STAGES } from '@/math/data/number-lab';
import { usePracticeProgress } from '@/math/hooks/usePracticeProgress';
import { labSummary } from '@/math/services/practice-progress';
import type { StageProgressMap } from '@/math/services/practice-progress';
import { readQuickReact, writeQuickReact } from '@/math/services/practice-settings';
import { MONO } from '@/math/components/QuizOption';

/** Earned stars only — the count is also spelled out in each card's aria-label. */
function Stars({ earned }: { earned: number }) {
  if (earned <= 0) return null;
  return (
    <span aria-hidden="true" style={{ fontSize: '1.05rem', letterSpacing: 2, color: 'var(--star)' }}>
      {'★★★'.slice(0, earned)}
    </span>
  );
}

/**
 * The Number Lab pillar: the ≤10 practice ladder plus the countdown toggle.
 * Doubles as the stage picker, so there is no extra landing screen between the
 * hub and a run.
 */
export function NumberLabPillar() {
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const { getStageProgress } = usePracticeProgress();
  const [progress, setProgress] = useState<StageProgressMap>({});
  const [quickReact, setQuickReact] = useState(false);

  useEffect(() => {
    getStageProgress().then(setProgress);
    setQuickReact(readQuickReact());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTimer = () => {
    const next = !quickReact;
    setQuickReact(next);
    writeQuickReact(next);
  };

  const { cleared, total } = labSummary(PRACTICE_STAGES, progress);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', borderRadius: 28, marginBottom: 22 }}>
        <span aria-hidden="true" className="ma-bee-float" style={{ display: 'grid', placeItems: 'center', width: 72, height: 72, flexShrink: 0, borderRadius: 24, background: 'var(--ma-soft)', fontSize: '2.4rem' }}>
          🐝
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.01em' }}>{t('lab.title')}</h2>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--muted-fg)', textWrap: 'pretty' }}>{t('lab.subtitle')}</p>
        </div>
      </div>

      <button
        onClick={toggleTimer}
        aria-pressed={quickReact}
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 18px', borderRadius: 22, marginBottom: 24, textAlign: 'left' }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>⏱</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 900, fontSize: '1rem' }}>{t('lab.timer.label')}</span>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted-fg)' }}>{t('lab.timer.hint')}</span>
        </span>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            minWidth: 88,
            padding: '12px 20px',
            borderRadius: 9999,
            fontWeight: 900,
            fontSize: '0.95rem',
            background: quickReact ? 'var(--ma)' : 'var(--secondary)',
            color: quickReact ? '#fff' : 'var(--ma-ink)',
          }}
        >
          {quickReact ? t('lab.timer.on') : t('lab.timer.off')}
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 4px 14px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>{t('lab.pickAPractice')}</h3>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
          {t('lab.clearedOf', { cleared, total })}
        </span>
      </div>

      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
        {PRACTICE_STAGES.map((stage) => {
          const stars = progress[stage.index]?.stars ?? 0;
          const name = t(stage.nameKey);
          return (
            <li key={stage.id}>
              <button
                onClick={() => navigate(`/math/practice/${stage.id}`)}
                aria-label={t('lab.stageAria', { name, index: stage.index, stars })}
                className="card lift"
                style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', padding: '18px 20px', borderRadius: 26, textAlign: 'left' }}
              >
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 58, height: 58, flexShrink: 0, borderRadius: 20, background: 'var(--ma-soft)', fontSize: '1.9rem' }}>
                  {stage.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 900, fontSize: '1.1rem' }}>{name}</span>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--muted-fg)', fontFamily: MONO }}>
                    {stage.example}
                  </span>
                </span>
                <Stars earned={stars} />
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, flexShrink: 0, borderRadius: 9999, background: 'var(--primary)', color: '#fff', fontSize: '1.15rem', fontWeight: 900 }}>
                  ▶
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
