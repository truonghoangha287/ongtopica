import { useReducer, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFindXStageById, findXLevelOf } from '@/math/data/number-lab';
import { composeFindXRun } from '@/math/services/find-x-generator';
import { findXReducer, initFindXRun } from '@/math/services/find-x-run';
import type { FindXRunState, FindXStats } from '@/math/services/find-x-run';
import { usePracticeProgress } from '@/math/hooks/usePracticeProgress';
import { computeStars, computeAccuracy } from '@/math/services/quiz-scorer';
import { FindXView } from '@/math/components/FindXView';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { StarRating } from '@/math/types/math.types';

interface RewardData { stars: StarRating; streak: number; accuracy: number; recovered: number; stats: FindXStats }

/** The empty run a reducer needs before the real one has loaded. */
const EMPTY: FindXRunState = initFindXRun([], 'guided');

/**
 * One Find X stage.
 *
 * Hearts off and no countdown, inherited from the Number Lab: this is the
 * pillar for the thing she finds hardest, so a run must never end in a game
 * over, and a clock on a "think it through" exercise rewards guessing.
 */
export function FindXPage() {
  const { stage: stageId } = useParams<{ stage: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const stage = stageId ? getFindXStageById(stageId) : undefined;
  const level = stageId ? findXLevelOf(stageId) : undefined;

  const { getStageProgress, recordStageCleared } = usePracticeProgress();
  const [state, dispatch] = useReducer(findXReducer, EMPTY);
  const [reward, setReward] = useState<RewardData | null>(null);
  const [runKey, setRunKey] = useState(0);
  // `EMPTY` is itself a "done" run (zero problems), so the reward effect below
  // must not fire until a real run has actually been loaded — otherwise the
  // very first render would look like an instantly-cleared stage.
  const [loaded, setLoaded] = useState(false);

  // The attempt cursor picks a different problem set each replay, so starting a
  // run always reads the child's stored progress first.
  useEffect(() => {
    if (!stage || !level) return;
    let cancelled = false;
    setLoaded(false);
    void (async () => {
      const progress = await getStageProgress();
      if (cancelled) return;
      const problems = composeFindXRun(level, progress[stage.index]?.attempt ?? 1);
      setReward(null);
      dispatch({ type: 'load', problems, level });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [stage?.id, runKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stage || !loaded || !state.done || reward) return;
    void (async () => {
      const stars = computeStars(state.firstPass, state.originalTotal);
      const accuracy = computeAccuracy(state.firstPass, state.originalTotal);
      const { economy } = await recordStageCleared(stage.index, stars);
      setReward({
        stars,
        streak: economy.streak,
        accuracy,
        recovered: state.mastered - state.firstPass,
        stats: state.stats,
      });
    })();
  }, [state.done, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stage || !level) return <div style={{ padding: 24 }}>Stage not found.</div>;

  const backToLab = () => navigate('/');

  if (reward) {
    return (
      <MathRewardScreen
        variant="practice"
        topicName={t(stage.nameKey)}
        level={stage.index}
        stars={reward.stars}
        streak={reward.streak}
        accuracy={reward.accuracy}
        recovered={reward.recovered}
        breakdown={reward.stats}
        onNext={() => setRunKey((k) => k + 1)}
        onBackToHive={backToLab}
      />
    );
  }

  return (
    <FindXView
      state={state}
      stageIcon={stage.icon}
      stageName={t(stage.nameKey)}
      onAnswer={(value) => dispatch({ type: 'answer', value })}
      onNext={() => dispatch({ type: 'next' })}
      onReveal={() => dispatch({ type: 'reveal' })}
      onExit={backToLab}
    />
  );
}
