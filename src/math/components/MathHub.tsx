import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import type { MathEconomy } from '@/math/hooks/useMathProgress';
import type { ProgressMap } from '@/math/services/hive-progress';
import { SkillsHive } from '@/math/components/SkillsHive';
import { BeeOlympiad } from '@/math/components/BeeOlympiad';
import type { OlympiadTrack } from '@/math/types/math.types';

interface MathHubProps {
  economy: MathEconomy;
}

type Pillar = 'hive' | 'olympiad';

/** Each Olympiad track flavours its quiz with a matching topic (arbitrary but themed). */
const TRACK_TOPIC: Record<OlympiadTrack, string> = { kangaroo: 'patterns', sasmo: 'logic' };

/** Container for the two Math World pillars: Skills Hive and Bee Olympiad. */
export function MathHub({ economy }: MathHubProps) {
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const { getTopicProgress, getOlympiadSolved } = useMathProgress();
  const [pillar, setPillar] = useState<Pillar>('hive');
  const [progress, setProgress] = useState<ProgressMap>({});
  const [challengeDone, setChallengeDone] = useState(0);

  useEffect(() => {
    getTopicProgress().then(setProgress);
    getOlympiadSolved('kangaroo').then(setChallengeDone);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openTopic = (id: string) => navigate(`/math/topic/${id}`);
  const startOlympiad = (track: OlympiadTrack) =>
    navigate(`/math/quiz/${TRACK_TOPIC[track]}?mode=olympiad&track=${track}`);

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
        <BeeOlympiad challengeDone={challengeDone} onStart={startOlympiad} />
      )}
    </div>
  );
}
