import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWordSet } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { useSession } from '@/english/vocab/hooks/useSession';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { WordMap } from '@/english/vocab/components/WordMap';
import { starCount } from '@/english/vocab/components/star-row';
import { getSkill, SKILL_ACTIVITIES, type TopicActivity } from '@/english/vocab/skills';
import { MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';

/**
 * Activities for one skill within one topic (word set). Reuses the existing session /
 * game engines and folds in the per-word Word Map progress visualization (previously on
 * the retired WordSetPage).
 */
export function TopicActivitiesPage() {
  const { skillId, topicId } = useParams<{ skillId: string; topicId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const skill = getSkill(skillId);
  const wordSet = topicId ? getWordSet(topicId) : undefined;
  const { composeSession, composeListenMatch, isComposing } = useSession();
  const wordProgressHook = useWordProgress();
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});

  useEffect(() => {
    if (!wordSet) return;
    wordProgressHook.getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.wordId, r])));
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!skill || !wordSet) return <div style={{ padding: 24 }}>Not found.</div>;

  const activities = SKILL_ACTIVITIES[skill.id];
  const total = wordSet.words.length;
  const allMastered = wordSet.words.every((w) => {
    const p = progressMap[w.id];
    return p && p.stage === 4 && p.consecutiveCorrect >= MASTERY_THRESHOLD;
  });

  // Star-based progress across the set, mirroring the Home progress tiles.
  const earnedStars = wordSet.words.reduce((sum, w) => sum + starCount(progressMap[w.id]), 0);
  const pct = total ? Math.round((earnedStars / (total * 4)) * 100) : 0;

  const runActivity = async (activity: TopicActivity) => {
    if (activity.kind === 'memory') {
      navigate(`/memory/${wordSet.id}`);
      return;
    }
    const session =
      activity.kind === 'listen-match'
        ? await composeListenMatch(wordSet)
        : await composeSession(wordSet, activity.stage);
    navigate('/session', { state: { session } });
  };

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
          ←
        </button>
        <span aria-hidden="true" style={{ fontSize: '1.8rem' }}>{wordSetIcon(wordSet.id)}</span>
        <div style={{ lineHeight: 1.15, textAlign: 'left' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-fg)', fontWeight: 700 }}>
            {skill.emoji} {t(`skills.${skill.id}.name`)}
          </div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{t(`wordSets.${wordSet.id}`)}</h1>
        </div>
        {allMastered && (
          <span className="badge" style={{ marginLeft: 'auto', background: 'var(--success)', color: 'white' }}>
            {t('session.completedBadge')}
          </span>
        )}
      </header>

      <section className="card" style={{ padding: 18, marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.15rem', margin: '0 0 10px' }}>
          {skill.emoji} {t(`skills.${skill.id}.name`)}
        </h2>
        <div className="progress" style={{ marginBottom: 14 }}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {activities.map((activity) => (
            <button
              key={activity.i18nKey}
              className="activity-btn"
              onClick={() => runActivity(activity)}
              disabled={isComposing}
              aria-label={t(activity.i18nKey)}
            >
              <span aria-hidden="true">{activity.emoji}</span>
              <span>{t(activity.i18nKey)}</span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </section>

      <h2 style={{ fontSize: '1.25rem', margin: '0 0 12px' }}>{t('wordSetPage.wordMap')}</h2>
      <WordMap wordSet={wordSet} progressMap={progressMap} />
    </div>
  );
}
