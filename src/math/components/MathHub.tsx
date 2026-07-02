import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import type { MathEconomy } from '@/math/hooks/useMathProgress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { SkillsHive } from '@/math/components/SkillsHive';
import { BeeOlympiad } from '@/math/components/BeeOlympiad';

interface MathHubProps {
  economy: MathEconomy;
}

type Pillar = 'hive' | 'olympiad';

/** Container for the two Math World pillars: Skills Hive and Bee Olympiad. */
export function MathHub({ economy }: MathHubProps) {
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const { getTopicProgress } = useMathProgress();
  const [pillar, setPillar] = useState<Pillar>('hive');
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    getTopicProgress().then(setProgress);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openTopic = (id: string) => navigate(`/math/topic/${id}`);
  const startOlympiad = () => navigate('/math/quiz/patterns?mode=olympiad');

  const tab = (key: Pillar, label: string) => {
    const active = pillar === key;
    return (
      <button
        role="tab"
        aria-selected={active}
        onClick={() => setPillar(key)}
        style={{
          padding: '9px 18px',
          borderRadius: 9999,
          background: active ? 'var(--ma)' : 'transparent',
          color: active ? '#fff' : 'var(--muted-fg)',
          fontWeight: active ? 900 : 800,
          fontSize: '0.86rem',
          boxShadow: active ? '0 8px 16px -8px var(--ma)' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div role="tablist" aria-label={t('hub.mathHiveTitle')} style={{ display: 'inline-flex', gap: 5, padding: 5, borderRadius: 9999, background: 'oklch(93% 0.02 80)' }}>
          {tab('hive', t('hub.skillsHive'))}
          {tab('olympiad', t('hub.beeOlympiad'))}
        </div>
      </div>

      {pillar === 'hive' ? (
        <SkillsHive progress={progress} hivesToday={economy.hivesToday} onOpenTopic={openTopic} />
      ) : (
        <BeeOlympiad challengeDone={progress.patterns?.stars ?? 0} onStart={startOlympiad} />
      )}
    </div>
  );
}
