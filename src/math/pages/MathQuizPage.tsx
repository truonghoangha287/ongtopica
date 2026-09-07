import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTopic } from '@/math/data/topics';
import { getQuiz, getOlympiadQuiz } from '@/math/data/quizzes';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { computeStars, computeAccuracy, STARTING_HEARTS } from '@/math/services/quiz-scorer';
import { QuizRunner } from '@/math/components/QuizRunner';
import type { QuizRunSummary } from '@/math/components/QuizRunner';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { OlympiadTrack, QuizQuestion, StarRating } from '@/math/types/math.types';

interface RewardData { stars: StarRating; streak: number; accuracy: number; level: number; }

/** A hive or Olympiad quiz: the shared runner, then the reward screen on finish. */
export function MathQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const isOlympiad = params.get('mode') === 'olympiad';
  const track = (params.get('track') as OlympiadTrack) || 'kangaroo';
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const topic = id ? getTopic(id) : undefined;

  const startQuiz = useMathQuizStore((s) => s.startQuiz);
  const { recordHiveCleared, recordOlympiadCleared, getTopicProgress } = useMathProgress();
  const [reward, setReward] = useState<RewardData | null>(null);
  const [level, setLevel] = useState(1);
  // Keep the loaded question set so "Try again" can restart the same run.
  const [questionSet, setQuestionSet] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    if (!topic) return;
    setReward(null);
    if (isOlympiad) {
      const qs = getOlympiadQuiz(track);
      setQuestionSet(qs);
      startQuiz(qs, { hearts: STARTING_HEARTS });
    } else {
      // Difficulty follows the child's current journey level for this topic.
      getTopicProgress().then((p) => {
        const lvl = p[topic.id]?.level ?? 1;
        setLevel(lvl);
        const qs = getQuiz(topic.id, lvl);
        setQuestionSet(qs);
        startQuiz(qs, { hearts: STARTING_HEARTS });
      });
    }
  }, [topic?.id, isOlympiad, track]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return <div style={{ padding: 24 }}>Topic not found.</div>;

  const finish = async ({ correctCount, total }: QuizRunSummary) => {
    const stars = computeStars(correctCount, total);
    const accuracy = computeAccuracy(correctCount, total);
    if (isOlympiad) {
      const { economy } = await recordOlympiadCleared(track, correctCount);
      setReward({ stars, streak: economy.streak, accuracy, level: 1 });
    } else {
      const { economy } = await recordHiveCleared(topic.id, stars);
      setReward({ stars, streak: economy.streak, accuracy, level });
    }
  };

  const retry = () => {
    startQuiz(questionSet, { hearts: STARTING_HEARTS });
    setReward(null);
  };

  if (reward) {
    return (
      <MathRewardScreen
        variant={isOlympiad ? 'olympiad' : 'hive'}
        topicName={t(topic.nameKey)}
        level={reward.level}
        stars={reward.stars}
        streak={reward.streak}
        accuracy={reward.accuracy}
        onNext={() => navigate('/')}
        onBackToHive={() => navigate('/')}
      />
    );
  }

  return (
    <QuizRunner
      tagIcon={topic.icon}
      tagName={t(topic.nameKey)}
      onFinish={(s) => void finish(s)}
      onExit={() => navigate('/')}
      onRetry={retry}
    />
  );
}
