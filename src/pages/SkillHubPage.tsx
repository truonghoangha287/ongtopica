import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { wordSetRegistry } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { HomeProgressTile } from '@/english/vocab/components/home-progress-tile';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { getSkill, SENTENCE_ACTIVITIES } from '@/english/vocab/skills';
import { speak } from '@/shared/utils/speak';
import type { WordProgressRow } from '@/shared/db/schema';

/**
 * Skill hub: given a skill, list the topics (word sets) the child can practice it on.
 * The Reading & Writing hub additionally surfaces the cross-cutting sentence-level
 * activities, which are not scoped to a single word set.
 */
export function SkillHubPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const skill = getSkill(skillId);
  const wordProgressHook = useWordProgress();
  const [progressBySet, setProgressBySet] = useState<Record<string, Record<string, WordProgressRow>>>({});

  useEffect(() => {
    wordProgressHook.getAllProgress().then((rows) => {
      const bySet: Record<string, Record<string, WordProgressRow>> = {};
      for (const row of rows) {
        if (!bySet[row.wordSetId]) bySet[row.wordSetId] = {};
        bySet[row.wordSetId][row.wordId] = row;
      }
      setProgressBySet(bySet);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!skill) return <div style={{ padding: 24 }}>Skill not found.</div>;

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('settings.backButton')}>
          ←
        </button>
        <span aria-hidden="true" style={{ fontSize: '1.8rem' }}>{skill.emoji}</span>
        <h1 style={{ fontSize: '1.9rem', margin: 0 }}>{t(`skills.${skill.id}.name`)}</h1>
      </header>

      {skill.id === 'reading-writing' && (
        <section className="card" style={{ padding: 18, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0 }}>✍️ {t('skills.sentencePractice')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-fg)', fontWeight: 700, margin: '4px 0 0' }}>
              {t('readingWriting.sectionHint')}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {SENTENCE_ACTIVITIES.map((a) => (
              <button
                key={a.key}
                className="activity-btn"
                onClick={() => {
                  speak(t(`readingWriting.${a.key}`));
                  navigate(a.route);
                }}
                aria-label={t(`readingWriting.${a.key}`)}
              >
                <span aria-hidden="true">{a.emoji}</span>
                <span>{t(`readingWriting.${a.key}`)}</span>
                <span className="chev" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <h2 style={{ fontSize: '1.25rem', margin: '0 0 12px' }}>{t('skills.chooseTopic')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        {wordSetRegistry.map((ws) => (
          <button
            key={ws.id}
            className="card"
            onClick={() => {
              speak(t(`wordSets.${ws.id}`));
              navigate(`/skill/${skill.id}/${ws.id}`);
            }}
            style={{ padding: 18, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, textAlign: 'left' }}
          >
            <span aria-hidden="true" style={{ fontSize: '2rem', lineHeight: 1 }}>{wordSetIcon(ws.id)}</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t(`wordSets.${ws.id}`)}</span>
            <HomeProgressTile wordSet={ws} progressMap={progressBySet[ws.id] ?? {}} />
          </button>
        ))}
      </div>
    </div>
  );
}
