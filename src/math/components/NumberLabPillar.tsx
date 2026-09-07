import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PRACTICE_STAGES } from '@/math/data/number-lab';
import { usePracticeProgress } from '@/math/hooks/usePracticeProgress';
import { isStageUnlocked, labSummary } from '@/math/services/practice-progress';
import type { StageProgressMap } from '@/math/services/practice-progress';
import { readQuickReact, writeQuickReact } from '@/math/services/practice-settings';

/** Best-stars row, also spelled out in each card's aria-label. */
function Stars({ earned }: { earned: number }) {
  return (
    <span aria-hidden="true" style={{ fontSize: '0.8rem', letterSpacing: 1 }}>
      {[1, 2, 3].map((n) => (
        <span key={n} style={{ color: n <= earned ? 'var(--star)' : 'oklch(88% 0.02 85)' }}>★</span>
      ))}
    </span>
  );
}

/**
 * The Number Lab pillar: the ≤10 practice ladder plus the quick-react toggle.
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
    <div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 2px' }}>{t('lab.title')}</h2>
        <p style={{ margin: 0, color: 'var(--muted-fg)', fontWeight: 800, fontSize: '0.82rem' }}>
          {t('lab.subtitle')} · {t('lab.clearedOf', { cleared, total })}
        </p>
      </div>

      <button
        onClick={toggleTimer}
        aria-pressed={quickReact}
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', borderRadius: 16, marginBottom: 14, textAlign: 'left' }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⏱</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 900, fontSize: '0.9rem' }}>{t('lab.timer.label')}</span>
          <span style={{ display: 'block', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.72rem' }}>{t('lab.timer.hint')}</span>
        </span>
        <span
          className="badge"
          style={{ background: quickReact ? 'var(--ma)' : 'var(--muted)', color: quickReact ? '#fff' : 'var(--muted-fg)', fontWeight: 900, fontSize: '0.72rem' }}
        >
          {quickReact ? t('lab.timer.on') : t('lab.timer.off')}
        </span>
      </button>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, listStyle: 'none', margin: 0, padding: 0 }}>
        {PRACTICE_STAGES.map((stage) => {
          const stars = progress[stage.index]?.stars ?? 0;
          const unlocked = isStageUnlocked(stage, progress);
          const name = t(stage.nameKey);
          return (
            <li key={stage.id}>
              <button
                onClick={() => navigate(`/math/practice/${stage.id}`)}
                disabled={!unlocked}
                aria-label={unlocked
                  ? t('lab.stageAria', { name, index: stage.index, stars })
                  : t('lab.stageLockedAria', { name, index: stage.index })}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 18, textAlign: 'left', opacity: unlocked ? 1 : 0.55 }}
              >
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 14, background: 'var(--ma-soft)', fontSize: '1.25rem' }}>
                  {unlocked ? stage.icon : '🔒'}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 900, fontSize: '0.95rem' }}>{name}</span>
                  <span style={{ display: 'block', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.74rem' }}>
                    {unlocked ? <Stars earned={stars} /> : t('lab.lockedHint')}
                  </span>
                </span>
                {unlocked && (
                  <span className="badge" style={{ background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900, fontSize: '0.74rem' }}>
                    {t('lab.start')}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
