import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getWordSet } from '@/data/yle-starters/index';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { useSession } from '@/english/vocab/hooks/useSession';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import {
  getSkill,
  SKILL_ACTIVITIES,
  starMean,
  skillTopicProgress,
  type ActivityLaunch,
  type SkillActivity,
} from '@/english/vocab/data/skills';
import type { WordProgressRow } from '@/shared/db/schema';

/** True when the child has already cleared this scoped activity on this topic. */
function isDone(launch: ActivityLaunch, mean: number): boolean {
  switch (launch.kind) {
    case 'session': return mean >= launch.stage;
    case 'listenMatch': return mean >= 2;
    case 'memory': return mean >= 2;
    case 'route': return false; // cross-topic games aren't tracked per topic
  }
}

/** Topic page: the activities available for one skill on one topic. */
export function TopicActivitiesPage() {
  const { skillId, topicId } = useParams<{ skillId: string; topicId: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const { composeSession, composeListenMatch, isComposing } = useSession();
  const { getWordSetProgress } = useWordProgress();
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});

  const skill = skillId ? getSkill(skillId) : undefined;
  const wordSet = topicId ? getWordSet(topicId) : undefined;

  useEffect(() => {
    if (!wordSet) return;
    getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.wordId, r])));
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mean = wordSet ? starMean(wordSet, progressMap) : 0;
  // Grammar has no per-topic progress — the guard below sends it to /grammar.
  const pct =
    skill && skill.id !== 'grammar' && wordSet
      ? Math.round(skillTopicProgress(skill.id, wordSet, progressMap) * 100)
      : 0;

  const activities = skill ? SKILL_ACTIVITIES[skill.id] : [];
  // First not-yet-done activity is the recommended next step.
  const recommendedId = activities.find((a) => !isDone(a.launch, mean))?.id ?? null;

  if (!skill || !wordSet) {
    return <div style={{ padding: 24 }}>Not found. <a href="/">Go home</a></div>;
  }

  // Grammar is cross-topic, so /skill/grammar/<topic> is a URL with no meaning.
  if (skill.id === 'grammar') return <Navigate to="/grammar" replace />;

  const launch = async (a: SkillActivity) => {
    if (isComposing) return;
    switch (a.launch.kind) {
      case 'session': {
        const session = await composeSession(wordSet, a.launch.stage);
        navigate('/session', { state: { session } });
        break;
      }
      case 'listenMatch': {
        const session = await composeListenMatch(wordSet);
        navigate('/session', { state: { session } });
        break;
      }
      case 'memory':
        navigate(`/memory/${wordSet.id}`);
        break;
      case 'route':
        navigate(a.launch.route);
        break;
    }
  };

  return (
    <div className="page">
      <header style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
        <button className="icon-btn" onClick={() => navigate(`/skill/${skill.id}`)} aria-label={t('settings.backButton', 'Back')} style={{ fontSize: '1.3rem' }}>←</button>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: skill.accent }}>{skill.title}</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, whiteSpace: 'nowrap' }}>{wordSetIcon(wordSet.id)} {t(`wordSets.${wordSet.id}`)}</h1>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span className="progress" style={{ height: 12, flex: 1 }}>
          <i style={{ width: `${pct}%`, background: skill.accent }} />
        </span>
        <span style={{ fontWeight: 900, color: skill.accent, fontSize: '0.92rem', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>

      <h2 className="section-title" style={{ margin: '0 4px 13px' }}>{t('home.activities', 'Activities')}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activities.map((a) => {
          const done = isDone(a.launch, mean);
          const recommended = a.id === recommendedId;
          const bg = recommended ? skill.accent : 'var(--paper)';
          const fg = recommended ? '#fff' : 'var(--ink)';
          const sub = recommended ? 'rgba(255,255,255,.9)' : 'var(--muted-fg)';
          const iconBg = recommended ? 'rgba(255,255,255,.22)' : skill.soft;
          const shadow = recommended ? `0 14px 28px -12px ${skill.accent}` : 'var(--shadow-card)';
          const right = recommended ? '▶' : done ? '✓' : '›';
          return (
            <button
              key={a.id}
              className="lift"
              onClick={() => launch(a)}
              disabled={isComposing}
              style={{ display: 'flex', alignItems: 'center', gap: 15, width: '100%', textAlign: 'left', padding: '16px 18px', borderRadius: 22, background: bg, boxShadow: shadow }}
              aria-label={t(a.i18nKey)}
            >
              <span aria-hidden="true" style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 15, display: 'grid', placeItems: 'center', fontSize: '1.5rem', background: iconBg }}>{a.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '1.12rem', fontWeight: 900, color: fg }}>{t(a.i18nKey)}</span>
                <span style={{ display: 'block', fontSize: '0.83rem', fontWeight: 700, color: sub }}>{a.desc}</span>
              </span>
              <span aria-hidden="true" style={{ flexShrink: 0, fontSize: '1.2rem', color: fg }}>{right}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
