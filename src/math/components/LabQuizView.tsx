import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BeeMascot } from '@/math/components/BeeMascot';
import { MONO } from '@/math/components/QuizOption';
import { QuizAnswerPad } from '@/math/components/QuizAnswerPad';
import { TenFrame } from '@/math/components/TenFrame';
import { QuizTimerBar } from '@/math/components/QuizTimerBar';
import { counterGroups, equationParts } from '@/math/services/equation-parts';
import type { QuizQuestion } from '@/math/types/math.types';

export interface LabQuizViewProps {
  question: QuizQuestion;
  tagIcon: string;
  tagName: string;
  /** Tapped value for tile questions, option index for symbols. */
  selected: number | null;
  checked: boolean;
  correct: boolean;
  /** 0-based position in the run. */
  qIndex: number;
  /** First-pass length — the denominator a child is shown. */
  originalTotal: number;
  /** True once the run has moved on to re-asking earlier misses. */
  inReview: boolean;
  /** Right first time plus right on the second look. */
  mastered: number;
  timerOn: boolean;
  secondsLeft: number;
  timerSeconds: number;
  /** The graded feedback sentence, or '' before checking. */
  mood: string;
  primaryLabel: string;
  primaryDisabled: boolean;
  onSelect: (value: number) => void;
  onPrimary: () => void;
  onExit: () => void;
}

/** The label a value reads as inside the blank: a numeral, or a comparison glyph. */
function tokenFor(question: QuizQuestion, value: number | null): string {
  if (value === null) return '?';
  return question.input === 'symbols' ? question.options[value] ?? '?' : String(value);
}

/** The answer, as it is written back into the blank once the question is graded. */
function answerToken(question: QuizQuestion): string {
  return question.input === 'symbols'
    ? question.options[question.answer]
    : String(question.answerValue ?? question.options[question.answer]);
}

/** One pile of counters, in the colour that ties it to its side of the equation. */
function Dots({ count, color }: { count: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} style={{ width: 26, height: 26, borderRadius: 9999, background: color }} />
      ))}
    </>
  );
}

/**
 * The Number Lab's play screen. Same run, same store as the hive's — but drawn
 * for the child who finds this hard: one big equation with the hidden number as
 * a box she can see her own answer land in, a countable pile of dots on demand,
 * and no hearts anywhere.
 */
export function LabQuizView(props: LabQuizViewProps) {
  const {
    question, tagIcon, tagName, selected, checked, correct, qIndex, originalTotal, inReview,
    mastered, timerOn, secondsLeft, timerSeconds, mood, primaryLabel, primaryDisabled,
    onSelect, onPrimary, onExit,
  } = props;
  const { t } = useTranslation('math');
  const [dotsOpen, setDotsOpen] = useState(false);

  // Every question starts with the scaffold put away, so reaching for it stays
  // her decision rather than a setting she left on.
  useEffect(() => setDotsOpen(false), [qIndex, question.id]);

  const filled = checked ? answerToken(question) : tokenFor(question, selected);
  const parts = equationParts(question, filled);
  const dots = counterGroups(question);
  const progress = inReview ? 1 : (qIndex + (checked ? 1 : 0)) / Math.max(1, originalTotal);

  return (
    <div className="page math-world" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <button className="icon-btn" onClick={onExit} aria-label={t('quiz.exitAria')}>✕</button>
        <div className="progress" style={{ flex: 1, height: 16, background: 'var(--secondary)' }}>
          <i style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
        </div>
        <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>
          {t('quiz.rightCount', { count: mastered })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999, background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900, fontSize: '0.95rem' }}>
          <span aria-hidden="true">{tagIcon}</span> {tagName}
        </span>
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
          {inReview ? t('quiz.secondLook') : t('quiz.questionOf', { index: qIndex + 1, total: originalTotal })}
        </span>
      </div>

      {timerOn && <QuizTimerBar secondsLeft={secondsLeft} totalSeconds={timerSeconds} wide />}

      <div className="card" style={{ padding: '30px 24px 26px', borderRadius: 32, marginBottom: 20 }}>
        <h1 style={{ margin: '0 0 20px', textAlign: 'center', fontSize: '1.15rem', fontWeight: 900 }}>
          {t(question.promptKey, question.vars)}
        </h1>

        {typeof question.tenFrame === 'number' && <TenFrame filled={question.tenFrame} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {parts.map((part, i) => (part.blank ? (
            <span
              key={i}
              aria-label={t('quiz.blankAria')}
              style={{ display: 'grid', placeItems: 'center', minWidth: 88, height: 88, padding: '0 10px', borderRadius: 24, background: 'var(--secondary)', border: '4px dashed var(--accent)', color: 'var(--ma-ink)', fontFamily: MONO, fontSize: '2.8rem', fontWeight: 800 }}
            >
              {part.text}
            </span>
          ) : (
            <span key={i} style={{ fontFamily: MONO, fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {part.text}
            </span>
          )))}
        </div>

        {question.hintKey && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--muted-fg)', textWrap: 'pretty' }}>
            {t(question.hintKey, question.vars)}
          </p>
        )}

        {dots && dotsOpen && (
          <div
            role="img"
            aria-label={t('lab.dots.aria', { first: dots[0], second: dots[1] })}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, padding: 16, borderRadius: 22, background: 'var(--bg)' }}
          >
            <Dots count={dots[0]} color="var(--primary)" />
            <Dots count={dots[1]} color="var(--accent)" />
          </div>
        )}
      </div>

      <QuizAnswerPad question={question} selected={selected} checked={checked} onSelect={onSelect} size="large" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
        {dots && !checked && (
          <button
            onClick={() => setDotsOpen(!dotsOpen)}
            aria-pressed={dotsOpen}
            style={{ padding: '14px 22px', borderRadius: 9999, background: 'var(--paper)', boxShadow: 'var(--shadow-soft)', fontWeight: 800, fontSize: '1rem', color: 'var(--ma-ink)' }}
          >
            {dotsOpen ? t('lab.dots.hide') : t('lab.dots.show')}
          </button>
        )}
        <BeeMascot size={38} reaction={!checked ? 'idle' : correct ? 'celebrate' : 'encourage'} float={!checked} />
        <button
          onClick={onPrimary}
          disabled={primaryDisabled}
          style={{ padding: '18px 44px', borderRadius: 9999, color: '#fff', fontWeight: 900, fontSize: '1.2rem', background: primaryDisabled ? 'oklch(88% 0.02 85)' : correct ? 'var(--success)' : 'var(--primary)', boxShadow: primaryDisabled ? 'none' : '0 14px 26px -14px rgba(90,65,30,.7)' }}
        >
          {primaryLabel}
        </button>
      </div>

      <p role="status" style={{ margin: '16px 0 0', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', minHeight: '1.4em', textWrap: 'pretty', color: 'oklch(38% 0.03 60)' }}>
        {mood}
      </p>
    </div>
  );
}
