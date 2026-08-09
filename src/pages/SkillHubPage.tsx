import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { getSkill, SKILL_ACTIVITIES, skillTopicProgress, type SkillId, type TopicSkillId } from '@/english/vocab/data/skills';
import { speak } from '@/shared/utils/speak';
import type { WordProgressRow } from '@/shared/db/schema';

/** Skill hub: pick a topic to practise this skill on. */
export function SkillHubPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { getAllProgress } = useWordProgress();
  const [progressBySet, setProgressBySet] = useState<Record<string, Record<string, WordProgressRow>>>({});

  useEffect(() => {
    getAllProgress().then((rows) => {
      const bySet: Record<string, Record<string, WordProgressRow>> = {};
      for (const row of rows) {
        (bySet[row.wordSetId] ??= {})[row.wordId] = row;
      }
      setProgressBySet(bySet);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const skill = skillId ? getSkill(skillId) : undefined;
  if (!skill) return <div style={{ padding: 24 }}>Skill not found. <a href="/">Go home</a></div>;

  // Grammar has its own hub at /grammar; it is never topic-scoped.
  if (skill.id === 'grammar') return <Navigate to="/grammar" replace />;

  const count = SKILL_ACTIVITIES[skill.id as SkillId].length;

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 6 }}>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('settings.backButton', 'Back')} style={{ fontSize: '1.3rem' }}>←</button>
        <span aria-hidden="true" style={{ width: 54, height: 54, flexShrink: 0, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: '1.8rem', background: skill.soft }}>{skill.emoji}</span>
        <div style={{ lineHeight: 1.15 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{skill.title}</h1>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--muted-fg)' }}>
            {t('home.hubSubtitle', '{{count}} ways to practise · {{topics}} topics', { count, topics: wordSetRegistry.length })}
          </div>
        </div>
      </header>

      <h2 className="section-title" style={{ margin: '22px 4px 14px' }}>{t('home.chooseTopic', 'Choose a topic')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(152px, 1fr))', gap: 14 }}>
        {wordSetRegistry.map((ws) => {
          const p = skillTopicProgress(skill.id as TopicSkillId, ws, progressBySet[ws.id] ?? {});
          const stars = Math.round(p * 4);
          return (
            <button
              key={ws.id}
              className="card lift"
              onClick={() => {
                speak(t(`wordSets.${ws.id}`));
                navigate(`/skill/${skill.id}/${ws.id}`);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 17, borderRadius: 22, textAlign: 'left' }}
              aria-label={`${t(`wordSets.${ws.id}`)}, ${stars} of 4 stars`}
            >
              <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>{wordSetIcon(ws.id)}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink)' }}>{t(`wordSets.${ws.id}`)}</span>
              <span aria-hidden="true" style={{ fontSize: '1rem', letterSpacing: '1.5px' }}>
                <span style={{ color: 'var(--star)' }}>{'★'.repeat(stars)}</span>
                <span style={{ color: 'var(--border)' }}>{'☆'.repeat(4 - stars)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
