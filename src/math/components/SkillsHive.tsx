import { useTranslation } from 'react-i18next';
import { MATH_TOPICS } from '@/math/data/topics';
import { hubSummary, isTopicUnlocked, currentTopic } from '@/math/services/hive-progress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { HIVE_FRAME_WIDTH, HIVE_FRAME_HEIGHT, DAILY_GOAL_HIVES } from '@/math/constants/math-constants';
import { HexCell } from '@/math/components/HexCell';
import { BeeMascot } from '@/math/components/BeeMascot';

interface SkillsHiveProps {
  progress: ProgressMap;
  hivesToday: number;
  onOpenTopic: (id: string) => void;
}

/** The honeycomb of eight topic cells plus the daily-goal strip. */
export function SkillsHive({ progress, hivesToday, onOpenTopic }: SkillsHiveProps) {
  const { t } = useTranslation('math');
  const summary = hubSummary(MATH_TOPICS, progress);
  const current = currentTopic(MATH_TOPICS, progress);
  const goalDone = Math.min(hivesToday, DAILY_GOAL_HIVES);
  const goalPct = (goalDone / DAILY_GOAL_HIVES) * 100;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{t('hub.mathHiveTitle')}</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.86rem' }}>
            {t('hub.mathHiveSubtitle')}
          </p>
        </div>
        <span className="badge" style={{ background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 800 }}>
          {t('hub.hiveStars', { mastered: summary.mastered, total: summary.total })}
        </span>
      </div>

      <div
        role="group"
        aria-label={t('hub.mathHiveTitle')}
        style={{ position: 'relative', width: HIVE_FRAME_WIDTH, height: HIVE_FRAME_HEIGHT, margin: '6px auto 0', maxWidth: '100%' }}
      >
        {MATH_TOPICS.map((topic) => (
          <HexCell
            key={topic.id}
            topic={topic}
            stars={progress[topic.id]?.stars ?? 0}
            unlocked={isTopicUnlocked(topic, progress)}
            isCurrent={current?.id === topic.id}
            onOpen={onOpenTopic}
          />
        ))}
        <span
          style={{ position: 'absolute', left: 96, top: 58, zIndex: 6, pointerEvents: 'none' }}
        >
          <BeeMascot size={32} float />
        </span>
      </div>

      {/* Daily goal strip */}
      <div
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, padding: '12px 14px' }}
      >
        <span aria-hidden="true" style={{ fontSize: '1.35rem' }}>🎯</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.82rem', marginBottom: 5 }}>
            <span>{t('hub.todaysGoal')}</span>
            <span style={{ color: 'var(--muted-fg)' }}>{t('hub.goalProgress', { done: goalDone, total: DAILY_GOAL_HIVES })}</span>
          </div>
          <div className="progress" style={{ background: 'var(--ma-soft)' }}>
            <i style={{ width: `${goalPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
