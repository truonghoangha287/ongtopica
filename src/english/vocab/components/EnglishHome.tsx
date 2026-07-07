import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speak } from '@/shared/utils/speak';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { SKILLS } from '@/english/vocab/skills';
import { starCount } from '@/english/vocab/components/star-row';
import type { WordProgressRow } from '@/shared/db/schema';

const LEVELS = ['Starters', 'Movers', 'Flyers'] as const;

interface EnglishHomeProps {
  /** wordSetId → (wordId → progress row) for the active child. */
  progressBySet: Record<string, Record<string, WordProgressRow>>;
}

/** The English subject body: CEFR level switch + skill grid (skill-first flow). */
export function EnglishHome({ progressBySet }: EnglishHomeProps) {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  // Aggregate star progress across every word set — a single overall bar per skill
  // card (each skill practices the same topics, so overall coverage is a fair proxy).
  const earnedStars = wordSetRegistry.reduce(
    (sum, ws) => sum + ws.words.reduce((s, w) => s + starCount(progressBySet[ws.id]?.[w.id]), 0),
    0,
  );
  const totalStars = wordSetRegistry.reduce((sum, ws) => sum + ws.words.length * 4, 0);
  const overallPct = totalStars ? Math.round((earnedStars / totalStars) * 100) : 0;

  return (
    <div>
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
        {SKILLS.map((skill) => (
          <button
            key={skill.id}
            className="card"
            onClick={() => {
              speak(t(`skills.${skill.id}.name`));
              navigate(`/skill/${skill.id}`);
            }}
            style={{ padding: 18, minHeight: 140, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left', borderTop: `4px solid ${skill.accent}` }}
          >
            <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>{skill.emoji}</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t(`skills.${skill.id}.name`)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', fontWeight: 700 }}>{t(`skills.${skill.id}.hint`)}</span>
            <span
              aria-label={t('skills.overallProgress', { pct: overallPct })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginTop: 'auto' }}
            >
              <span aria-hidden="true" style={{ color: 'var(--star)', fontSize: '1rem', lineHeight: 1 }}>★</span>
              <span className="progress" style={{ height: 8, flex: 1 }}>
                <i style={{ width: `${overallPct}%`, background: 'var(--star)' }} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
