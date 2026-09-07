import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getPracticeStageById, getPracticeQuiz } from '@/math/data/number-lab';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { usePracticeProgress } from '@/math/hooks/usePracticeProgress';
import { computeStars, computeAccuracy } from '@/math/services/quiz-scorer';
import { readQuickReact } from '@/math/services/practice-settings';
import { QUICK_REACT_SECONDS } from '@/math/constants/math-constants';
import { QuizRunner } from '@/math/components/QuizRunner';
import type { QuizRunSummary } from '@/math/components/QuizRunner';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { QuizQuestion, StarRating } from '@/math/types/math.types';

interface RewardData { stars: StarRating; streak: number; accuracy: number; recovered: number; }

/**
 * One Number Lab stage.
 *
 * Runs with hearts OFF and misses re-asked: this is the mode for the thing a
 * child is weakest at, so it must never end in a game-over, and a wrong answer
 * has to come back around once she has seen the right one. Stars count answers
 * she ended up getting right — including on the second look — so persistence is
 * what gets rewarded.
 */
export function NumberLabQuizPage() {
  const { stage: stageId } = useParams<{ stage: string }>();
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const stage = stageId ? getPracticeStageById(stageId) : undefined;

  const startQuiz = useMathQuizStore((s) => s.startQuiz);
  const { getStageProgress, recordStageCleared } = usePracticeProgress();
  const [reward, setReward] = useState<RewardData | null>(null);
  const [questionSet, setQuestionSet] = useState<QuizQuestion[]>([]);
  const [timed] = useState(readQuickReact);

  // The attempt cursor picks a different question window each replay, so
  // starting a run always reads the child's progress first.
  const startRun = async (index: number) => {
    const p = await getStageProgress();
    const qs = getPracticeQuiz(index, p[index]?.attempt ?? 1);
    setQuestionSet(qs);
    setReward(null);
    startQuiz(qs, { hearts: 0, requeueMisses: true });
  };

  useEffect(() => {
    if (!stage) return;
    setReward(null);
    void startRun(stage.index);
  }, [stage?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stage) return <div style={{ padding: 24 }}>Stage not found.</div>;

  const backToLab = () => navigate('/');

  const finish = async ({ correctCount, recoveredCount, total }: QuizRunSummary) => {
    const mastered = correctCount + recoveredCount;
    const stars = computeStars(mastered, total);
    const accuracy = computeAccuracy(mastered, total);
    const { economy } = await recordStageCleared(stage.index, stars);
    setReward({ stars, streak: economy.streak, accuracy, recovered: recoveredCount });
  };

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
        onNext={() => void startRun(stage.index)}
        onBackToHive={backToLab}
      />
    );
  }

  return (
    <QuizRunner
      variant="lab"
      tagIcon={stage.icon}
      tagName={t(stage.nameKey)}
      timerSeconds={timed ? QUICK_REACT_SECONDS : undefined}
      onFinish={(s) => void finish(s)}
      onExit={backToLab}
      onRetry={() => startQuiz(questionSet, { hearts: 0, requeueMisses: true })}
    />
  );
}
