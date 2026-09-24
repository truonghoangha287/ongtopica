import { useTranslation } from 'react-i18next';
import { BeeMascot } from '@/math/components/BeeMascot';
import { MONO } from '@/math/components/QuizOption';
import { PartWholeBar } from '@/math/components/PartWholeBar';
import { FindXTrail } from '@/math/components/FindXTrail';
import { FindXStepCard } from '@/math/components/FindXStepCard';
import { equationOf, storyKindOf } from '@/math/services/find-x-steps';
import type { FindXRunState } from '@/math/services/find-x-run';
import { FINDX_VALUE_MAX } from '@/math/constants/math-constants';

interface FindXViewProps {
  state: FindXRunState;
  stageIcon: string;
  stageName: string;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onReveal: () => void;
  onExit: () => void;
}

/**
 * The Find X play screen: the problem, the bar model, what she has decided so
 * far, and the one decision in front of her.
 *
 * No hearts and no countdown anywhere — this is the stage for the thing she
 * finds hardest, and a clock on a "think it through" exercise rewards guessing.
 */
export function FindXView(props: FindXViewProps) {
  const { state, stageIcon, stageName, onAnswer, onNext, onReveal, onExit } = props;
  const { t } = useTranslation('math');
  const problem = state.problems[state.pIndex];
  if (!problem) return <div className="page math-world" />;

  const inReview = state.pIndex >= state.originalTotal;
  const progress = inReview ? 1 : (state.pIndex + (state.problemComplete ? 1 : 0)) / Math.max(1, state.originalTotal);
  const storyKind = problem.story ? storyKindOf(problem.form) : null;
  const isLast = state.pIndex >= state.problems.length - 1;

  return (
    <div className="page math-world" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <button className="icon-btn" onClick={onExit} aria-label={t('findx.exitAria')}>✕</button>
        <div className="progress" style={{ flex: 1, height: 16, background: 'var(--secondary)' }}>
          <i style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
        </div>
        <span lang="vi" style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>
          {t('findx.rightCount', { count: state.mastered })}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999, background: 'var(--ma-soft)', color: 'var(--ma-ink)', fontWeight: 900, fontSize: '0.95rem' }}>
          <span aria-hidden="true">{stageIcon}</span> <span lang="vi">{stageName}</span>
        </span>
        <span lang="vi" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-fg)' }}>
          {inReview ? t('findx.secondLook') : t('findx.questionOf', { index: state.pIndex + 1, total: state.originalTotal })}
        </span>
      </div>

      <div className="card" style={{ padding: '26px 20px 22px', borderRadius: 32, marginBottom: 18 }}>
        <p lang="vi" style={{ margin: '0 0 8px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ma-ink)' }}>
          {storyKind ? t('findx.storyLabel') : t('findx.problemLabel')}
        </p>
        {storyKind && (
          <p lang="vi" style={{ margin: '0 0 12px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 900, textWrap: 'balance' }}>
            {t(`findx.story.${storyKind}.${problem.story}`, { a: problem.a, b: problem.b })}
          </p>
        )}
        <h1 style={{ margin: 0, textAlign: 'center', fontFamily: MONO, fontSize: '2.1rem', fontWeight: 800 }}>
          {equationOf(problem, state.problemComplete ? String(problem.x) : 'x')}
        </h1>
      </div>

      <PartWholeBar problem={problem} solved={state.problemComplete} />

      <FindXTrail entries={state.trail} />

      {state.problemComplete ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <BeeMascot size={40} reaction="celebrate" />
          <button
            lang="vi"
            onClick={onNext}
            style={{ padding: '18px 44px', borderRadius: 9999, background: 'var(--success)', color: '#fff', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 14px 26px -14px rgba(90,65,30,.7)' }}
          >
            {isLast ? t('findx.finish') : t('findx.continue')}
          </button>
        </div>
      ) : (
        <>
          <FindXStepCard
            step={state.steps[state.stepIndex]}
            wrongValues={state.wrongValues}
            onAnswer={onAnswer}
            tileMax={FINDX_VALUE_MAX}
          />
          {state.level !== 'guided' && !state.revealed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button
                lang="vi"
                onClick={onReveal}
                style={{ padding: '14px 22px', borderRadius: 9999, background: 'var(--paper)', boxShadow: 'var(--shadow-soft)', fontWeight: 800, fontSize: '1rem', color: 'var(--ma-ink)' }}
              >
                {t('findx.reveal')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
