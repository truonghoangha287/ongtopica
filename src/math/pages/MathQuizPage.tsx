import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTopic } from '@/math/data/topics';
import { getQuiz } from '@/math/data/quizzes';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { useMathProgress } from '@/math/hooks/useMathProgress';
import { computeStars, computeAccuracy, isCorrect, progressFraction } from '@/math/services/quiz-scorer';
import { playWin, playBuzz } from '@/shared/utils/sfx';
import { BeeMascot } from '@/math/components/BeeMascot';
import { QuizOption, MONO } from '@/math/components/QuizOption';
import { MathRewardScreen } from '@/math/components/MathRewardScreen';
import type { StarRating } from '@/math/types/math.types';

interface RewardData { stars: StarRating; streak: number; accuracy: number; level: number; }

/** Sequence tiles ("what comes next"), with the missing value shown as "?". */
function SeqDisplay({ seq }: { seq: string[] }) {
  const { t } = useTranslation('math');
  const tile: React.CSSProperties = { display: 'grid', placeItems: 'center', width: 60, height: 60, borderRadius: 16, background: '#fff', boxShadow: '0 6px 18px -12px rgba(80,60,30,.4)', fontFamily: MONO, fontSize: '1.5rem', fontWeight: 800 };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 9, marginBottom: 22, flexWrap: 'wrap' }}>
      {seq.map((n, i) => <span key={i} style={tile}>{n}</span>)}
      <span aria-label={t('quiz.missingTileAria')} style={{ ...tile, background: 'var(--ma-soft)', border: '3px dashed var(--ma)', color: 'var(--ma-ink)', fontSize: '1.7rem', fontWeight: 900 }}>?</span>
    </div>
  );
}

/** A hive quiz: question → answer → grading, then the reward screen on finish. */
export function MathQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const isOlympiad = params.get('mode') === 'olympiad';
  const { t } = useTranslation('math');
  const navigate = useNavigate();
  const topic = id ? getTopic(id) : undefined;

  const store = useMathQuizStore();
  const { recordHiveCleared, getTopicProgress } = useMathProgress();
  const [reward, setReward] = useState<RewardData | null>(null);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (!topic) return;
    store.startQuiz(topic.id, getQuiz(topic.id), isOlympiad);
    setReward(null);
    getTopicProgress().then((p) => setLevel(p[topic.id]?.level ?? 1));
  }, [topic?.id, isOlympiad]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!topic) return <div style={{ padding: 24 }}>Topic not found.</div>;

  const { questions, qIndex, selected, checked, hearts, correctCount } = store;
  const total = questions.length;
  const q = questions[qIndex];
  if (!q) return <div className="page math-world" />;

  const isLast = qIndex >= total - 1;
  const correct = checked && isCorrect(selected, q);
  const disabled = selected === null && !checked;

  const finish = async () => {
    const stars = computeStars(correctCount, total);
    const { economy } = await recordHiveCleared(topic.id, stars);
    setReward({ stars, streak: economy.streak, accuracy: computeAccuracy(correctCount, total), level });
  };

  const onPrimary = () => {
    if (checked) {
      if (isLast) void finish();
      else store.advance();
      return;
    }
    if (selected === null) return;
    if (isCorrect(selected, q)) playWin();
    else playBuzz();
    store.check();
  };

  if (reward) {
    return (
      <MathRewardScreen
        isOlympiad={isOlympiad}
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

  const primaryBg = disabled ? 'oklch(85% 0.02 85)' : correct ? 'var(--success)' : 'var(--ma)';
  const primaryLabel = checked ? (isLast ? t('quiz.finish') : t('quiz.continue')) : t('quiz.check');
  const mood = !checked ? '' : correct ? t('quiz.correctMood') : t('quiz.wrongMood', { answer: q.options[q.answer] });

  return (
    <div className="page math-world">
      {/* top bar: exit · progress · hearts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="icon-btn" onClick={() => navigate('/')} aria-label={t('quiz.exitAria')} style={{ width: 38, height: 38, fontSize: '1rem' }}>✕</button>
        <div className="progress" style={{ flex: 1, height: 12, background: 'var(--ma-soft)' }}>
          <i style={{ width: `${progressFraction(qIndex, checked, total) * 100}%`, background: 'var(--ma)' }} />
        </div>
        <div role="img" aria-label={t('aria.hearts', { count: hearts })} style={{ display: 'flex', gap: 2, fontSize: '1.05rem' }}>
          {[1, 2, 3].map((n) => <span key={n} aria-hidden="true">{n <= hearts ? '❤️' : '🤍'}</span>)}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="badge" style={{ background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900 }}>
          {t('quiz.tag', { icon: topic.icon, name: t(topic.nameKey), index: qIndex + 1, total })}
        </span>
        <span className="badge" style={{ background: 'var(--paper)', boxShadow: 'var(--shadow-card)', fontWeight: 900 }}>
          <span aria-hidden="true">🔥</span> {t('quiz.correctCount', { count: correctCount })}
        </span>
      </div>

      <h1 style={{ textAlign: 'center', fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 4px', lineHeight: 1.2 }}>{t(q.promptKey)}</h1>
      <p style={{ textAlign: 'center', margin: '0 0 20px', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.86rem', minHeight: '1.2em' }}>{t(q.hintKey)}</p>

      {q.type === 'seq' && q.seq ? (
        <SeqDisplay seq={q.seq} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <span style={{ padding: '18px 34px', borderRadius: 20, background: '#fff', boxShadow: '0 8px 22px -14px rgba(80,60,30,.45)', fontFamily: MONO, fontSize: '2rem', fontWeight: 800 }}>{q.expr}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 340, margin: '0 auto 18px' }}>
        {q.options.map((opt, i) => (
          <QuizOption key={i} label={opt} index={i} selected={selected} checked={checked} answerIndex={q.answer} onSelect={store.select} />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
        <BeeMascot size={34} reaction={!checked ? 'idle' : correct ? 'celebrate' : 'encourage'} float={!checked} />
        <button onClick={onPrimary} disabled={disabled} style={{ padding: '14px 40px', borderRadius: 9999, color: '#fff', fontWeight: 900, fontSize: '1.1rem', background: primaryBg, boxShadow: disabled ? 'none' : '0 14px 26px -12px var(--ma)' }}>
          {primaryLabel}
        </button>
      </div>
      <p role="status" style={{ textAlign: 'center', margin: '12px 0 0', fontWeight: 800, fontSize: '0.9rem', color: correct ? 'var(--success)' : 'var(--ma-ink)', minHeight: '1.2em' }}>{mood}</p>
    </div>
  );
}
