import { useTranslation } from 'react-i18next';
import { useMathQuizStore } from '@/math/store/math-quiz-store';
import { isCorrect, progressFraction, STARTING_HEARTS } from '@/math/services/quiz-scorer';
import { playWin, playBuzz } from '@/shared/utils/sfx';
import { BeeMascot } from '@/math/components/BeeMascot';
import { MONO } from '@/math/components/QuizOption';
import { symbolRevealKey } from '@/math/components/SymbolChoice';
import { QuizAnswerPad } from '@/math/components/QuizAnswerPad';
import { TenFrame } from '@/math/components/TenFrame';
import { QuizTimerBar } from '@/math/components/QuizTimerBar';
import { useQuestionTimer } from '@/math/hooks/useQuestionTimer';
import type { QuizQuestion } from '@/math/types/math.types';

/** What a completed run reports back to whichever screen owns the results. */
export interface QuizRunSummary {
  /** Right on the first pass. */
  correctCount: number;
  /** Right on the second look, after being re-asked. */
  recoveredCount: number;
  /** First-pass question count — the denominator for stars and accuracy. */
  total: number;
}

interface QuizRunnerProps {
  tagIcon: string;
  tagName: string;
  /** Seconds per question for the optional countdown; omit to disable it. */
  timerSeconds?: number;
  onFinish: (summary: QuizRunSummary) => void;
  onExit: () => void;
  onRetry: () => void;
}

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

/**
 * The play loop shared by every math quiz: question → answer → grading, with an
 * optional countdown. It owns no results; the caller decides what a finished run
 * means, which is what lets the hive (hearts, no requeue) and the Number Lab
 * (no hearts, misses re-asked) share one screen.
 *
 * The run itself lives in `math-quiz-store`; this component only renders it.
 */
export function QuizRunner({ tagIcon, tagName, timerSeconds, onFinish, onExit, onRetry }: QuizRunnerProps) {
  const { t } = useTranslation('math');
  const store = useMathQuizStore();
  const { questions, originalTotal, qIndex, selected, checked, timedOut, heartsEnabled, hearts, correctCount, recoveredCount } = store;

  const q: QuizQuestion | undefined = questions[qIndex];
  const inReview = qIndex >= originalTotal;

  const { enabled: timerOn, secondsLeft } = useQuestionTimer({
    seconds: timerSeconds,
    questionKey: `${qIndex}:${q?.id ?? ''}`,
    paused: checked || !q,
    onExpire: store.timeout,
  });

  if (!q) return <div className="page math-world" />;

  const isLast = qIndex >= questions.length - 1;
  const correct = checked && isCorrect(selected, q);
  const disabled = selected === null && !checked;
  // Out of hearts after a graded wrong answer → gentle game-over (no progress
  // recorded). Unreachable when hearts are off, which is how practice modes
  // guarantee a run always ends in a reward rather than a failure.
  const dead = heartsEnabled && checked && hearts <= 0;

  const onPrimary = () => {
    if (checked) {
      if (isLast) onFinish({ correctCount, recoveredCount, total: originalTotal });
      else store.advance();
      return;
    }
    if (selected === null) return;
    if (isCorrect(selected, q)) playWin();
    else playBuzz();
    store.check();
  };

  if (dead) {
    return (
      <div className="page math-world" style={{ textAlign: 'center' }}>
        <div style={{ marginTop: 40 }}>
          <BeeMascot size={44} reaction="encourage" />
        </div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '10px 0 4px' }}>{t('gameover.title')}</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--muted-fg)', fontWeight: 800 }}>{t('gameover.sub')}</p>
        <div role="img" aria-label={t('aria.hearts', { count: 0 })} style={{ display: 'flex', justifyContent: 'center', gap: 4, fontSize: '1.6rem', marginBottom: 24 }}>
          {Array.from({ length: STARTING_HEARTS }, (_, i) => <span key={i} aria-hidden="true">🤍</span>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
          <button onClick={onRetry} style={{ padding: 15, borderRadius: 9999, background: 'var(--ma)', color: '#fff', fontWeight: 900, fontSize: '1.05rem', boxShadow: '0 14px 26px -12px var(--ma)' }}>
            {t('gameover.retry')}
          </button>
          <button className="card" onClick={onExit} style={{ padding: 13, borderRadius: 9999, fontWeight: 800 }}>
            {t('gameover.exit')}
          </button>
        </div>
      </div>
    );
  }

  const primaryBg = disabled ? 'oklch(85% 0.02 85)' : correct ? 'var(--success)' : 'var(--ma)';
  const primaryLabel = checked ? (isLast ? t('quiz.finish') : t('quiz.continue')) : t('quiz.check');
  // Comparison glyphs are meaningless read aloud, so reveal them by name.
  const nameKey = q.input === 'symbols' ? symbolRevealKey(q.options[q.answer]) : undefined;
  const answerLabel = nameKey ? t(nameKey) : q.options[q.answer];
  const mood = !checked
    ? ''
    : correct
      ? t('quiz.correctMood')
      : timedOut
        ? t('lab.timer.timeUpMood', { answer: answerLabel })
        : t('quiz.wrongMood', { answer: answerLabel });

  return (
    <div className="page math-world">
      {/* top bar: exit · progress · hearts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="icon-btn" onClick={onExit} aria-label={t('quiz.exitAria')} style={{ width: 38, height: 38, fontSize: '1rem' }}>✕</button>
        <div className="progress" style={{ flex: 1, height: 12, background: 'var(--ma-soft)' }}>
          {/* Requeued questions sit past the first pass, so the bar holds at full
              rather than running backwards when a review round begins. */}
          <i style={{ width: `${(inReview ? 1 : progressFraction(qIndex, checked, originalTotal)) * 100}%`, background: 'var(--ma)' }} />
        </div>
        {heartsEnabled && (
          <div role="img" aria-label={t('aria.hearts', { count: hearts })} style={{ display: 'flex', gap: 2, fontSize: '1.05rem' }}>
            {Array.from({ length: STARTING_HEARTS }, (_, i) => <span key={i} aria-hidden="true">{i < hearts ? '❤️' : '🤍'}</span>)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="badge" style={{ background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900 }}>
          {inReview
            ? t('quiz.reviewRound', { icon: tagIcon, name: tagName })
            : t('quiz.tag', { icon: tagIcon, name: tagName, index: qIndex + 1, total: originalTotal })}
        </span>
        <span className="badge" style={{ background: 'var(--paper)', boxShadow: 'var(--shadow-card)', fontWeight: 900 }}>
          <span aria-hidden="true">🔥</span> {t('quiz.correctCount', { count: correctCount + recoveredCount })}
        </span>
      </div>

      {timerOn && <QuizTimerBar secondsLeft={secondsLeft} totalSeconds={timerSeconds ?? 0} />}

      <h1 style={{ textAlign: 'center', fontSize: '1.35rem', fontWeight: 900, margin: '8px 0 4px', lineHeight: 1.2 }}>{t(q.promptKey, q.vars)}</h1>
      <p style={{ textAlign: 'center', margin: '0 0 20px', color: 'var(--muted-fg)', fontWeight: 700, fontSize: '0.86rem', minHeight: '1.2em' }}>{q.hintKey ? t(q.hintKey, q.vars) : ''}</p>

      {typeof q.tenFrame === 'number' && <TenFrame filled={q.tenFrame} />}

      {q.type === 'seq' && q.seq ? (
        <SeqDisplay seq={q.seq} />
      ) : q.expr ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <span style={{ padding: '18px 34px', borderRadius: 20, background: '#fff', boxShadow: '0 8px 22px -14px rgba(80,60,30,.45)', fontFamily: MONO, fontSize: '2rem', fontWeight: 800 }}>{q.expr}</span>
        </div>
      ) : null}

      <QuizAnswerPad question={q} selected={selected} checked={checked} onSelect={store.select} />

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
