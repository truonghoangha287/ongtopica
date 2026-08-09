import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { speak } from '@/shared/utils/speak';
import { wordSetRegistry } from '@/data/yle-starters/index';
import {
  SKILLS,
  SKILL_ACTIVITIES,
  skillAggregateProgress,
  skillTopicProgress,
  type SkillId,
  type TopicSkillId,
} from '@/english/vocab/data/skills';
import type { WordProgressRow } from '@/shared/db/schema';

interface EnglishHomeProps {
  /** wordSetId → (wordId → progress row) for the active child. */
  progressBySet: Record<string, Record<string, WordProgressRow>>;
  /** Grammar track completion (0–100). Grammar is not topic-scoped. */
  grammarPct: number;
}

/** Find the most recently practised topic + the next skill worth resuming. */
function resumePoint(progressBySet: EnglishHomeProps['progressBySet']) {
  let bestSet: string | null = null;
  let bestAt = -1;
  for (const [setId, words] of Object.entries(progressBySet)) {
    for (const row of Object.values(words)) {
      if (row.lastReviewedAt != null && row.lastReviewedAt > bestAt) {
        bestAt = row.lastReviewedAt;
        bestSet = setId;
      }
    }
  }
  if (!bestSet) return null;
  const wordSet = wordSetRegistry.find((ws) => ws.id === bestSet);
  if (!wordSet) return null;
  const map = progressBySet[bestSet] ?? {};
  // Resume the first skill that still has room to grow on this topic. Grammar
  // is skipped: it has no per-topic progress to resume.
  const skill =
    SKILLS.find(
      (s) => s.id !== 'grammar' && skillTopicProgress(s.id as TopicSkillId, wordSet, map) < 1,
    ) ?? SKILLS[0];
  return { topicId: bestSet, skill };
}

/** The English subject body: continue-hero + skill list (skill-first nav). */
export function EnglishHome({ progressBySet, grammarPct }: EnglishHomeProps) {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  const resume = resumePoint(progressBySet);

  return (
    <div>
      {resume && (
        <button
          className="hero-card lift"
          style={{ background: resume.skill.accent, marginBottom: 26 }}
          onClick={() => navigate(`/skill/${resume.skill.id}/${resume.topicId}`)}
        >
          <span aria-hidden="true" className="hero-emoji">{resume.skill.emoji}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.09em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 3 }}>
              {t('home.keepGoing', 'Keep going')}
            </span>
            <span style={{ display: 'block', fontSize: '1.32rem', fontWeight: 900, lineHeight: 1.1 }}>
              {resume.skill.title} · {t(`wordSets.${resume.topicId}`)}
            </span>
          </span>
          <span aria-hidden="true" className="hero-go" style={{ color: resume.skill.accent }}>▶</span>
        </button>
      )}

      <h2 className="section-title">{t('home.chooseSkill', 'Choose what to practise')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SKILLS.map((s) => {
          const pct =
            s.id === 'grammar'
              ? grammarPct
              : Math.round(
                  skillAggregateProgress(s.id as TopicSkillId, wordSetRegistry, progressBySet) * 100,
                );
          const count = SKILL_ACTIVITIES[s.id as SkillId].length;
          return (
            <button
              key={s.id}
              className="card lift"
              onClick={() => {
                speak(s.title);
                // Grammar is cross-topic, so it skips the topic picker.
                navigate(s.id === 'grammar' ? '/grammar' : `/skill/${s.id}`);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', textAlign: 'left', padding: 18, borderRadius: 24 }}
              aria-label={`${s.title}, ${pct}% complete`}
            >
              <span aria-hidden="true" style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 18, display: 'grid', placeItems: 'center', fontSize: '2rem', background: s.soft }}>
                {s.emoji}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>{s.title}</span>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-fg)', marginBottom: 9 }}>
                  {s.blurb} · {t('home.activityCount', '{{count}} ways to play', { count })}
                </span>
                <span className="progress" style={{ display: 'block', height: 9 }}>
                  <i style={{ width: `${pct}%`, background: s.accent }} />
                </span>
              </span>
              <span aria-hidden="true" style={{ fontSize: '1.7rem', color: s.accent, flexShrink: 0 }}>›</span>
            </button>
          );
        })}

        {/* Speaking — not built yet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '15px 18px', borderRadius: 24, background: 'var(--muted)', opacity: 0.85 }}>
          <span aria-hidden="true" style={{ width: 50, height: 50, flexShrink: 0, borderRadius: 15, display: 'grid', placeItems: 'center', fontSize: '1.5rem', background: 'oklch(92% 0.008 85)' }}>🎤</span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 900, color: 'var(--muted-fg)' }}>{t('home.speaking', 'Speaking')}</span>
            <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted-fg)' }}>{t('home.comingSoon', 'Coming soon')}</span>
          </span>
          <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>🔒</span>
        </div>
      </div>
    </div>
  );
}
