import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { MONO } from '@/math/components/QuizOption';
import { NumberTileStrip } from '@/math/components/NumberTileStrip';
import { answerRole, answerVisualState } from '@/math/components/answer-state';
import { playWin, playBuzz } from '@/shared/utils/sfx';
import { computeMissKey, isStepCorrect } from '@/math/services/find-x-steps';
import type { FindXOption, FindXStep } from '@/math/types/find-x.types';

interface FindXStepCardProps {
  step: FindXStep;
  /** Option indices (or tapped numbers) already rejected on this step. */
  wrongValues: number[];
  onAnswer: (value: number) => void;
  /** Ceiling of the number strip on compute steps. */
  tileMax: number;
}

/**
 * Every Find X screen carries `lang="vi"`, so the tile strip it embeds must
 * speak Vietnamese too — the Number Lab's own `quiz.tile*Aria` keys are
 * English and would be mispronounced inside a region flagged as Vietnamese.
 * The same `findx.tile.wrong` key is reused below for rejected CHOICE
 * buttons, so the whole card speaks one language.
 */
const TILE_ARIA_KEYS = { tile: 'findx.tile.tap', wrong: 'findx.tile.wrong', strip: 'findx.tile.strip' };

/** An option's visible text: worded options go through i18n, numerals do not. */
export function optionLabel(t: TFunction, option: FindXOption): string {
  return option.labelKey ? t(option.labelKey, option.vars) : option.label ?? '';
}

/**
 * One decision: the question, the options, and — once something has been
 * rejected — why it was wrong.
 *
 * A rejected option stays on screen, disabled, rather than disappearing: the
 * reason is the teaching, and a child who cannot see what she picked cannot
 * connect the explanation to her own choice.
 */
export function FindXStepCard({ step, wrongValues, onAnswer, tileMax }: FindXStepCardProps) {
  const { t } = useTranslation('math');
  const headingId = 'findx-step-heading';
  const lastWrong = wrongValues.length > 0 ? wrongValues[wrongValues.length - 1] : null;
  const wrongOption = lastWrong === null || step.input === 'tiles' ? undefined : step.options[lastWrong];
  const statusText = wrongOption
    ? t(wrongOption.whyKey, wrongOption.vars ?? step.vars)
    : step.input === 'tiles' && lastWrong !== null
      ? t(computeMissKey(step, lastWrong), step.vars)
      : '';

  /**
   * Feedback fires per DECISION, not per problem, so the sound lands on the
   * choice that earned it. Same two clips the hive and the lab use.
   */
  const answer = (value: number) => {
    if (isStepCorrect(step, value)) playWin();
    else playBuzz();
    onAnswer(value);
  };

  return (
    <div
      lang="vi"
      role="group"
      aria-labelledby={headingId}
      style={{ borderRadius: 22, border: '3px dashed var(--accent)', padding: '18px 16px', background: 'oklch(99% 0.012 88)' }}
    >
      <h2 id={headingId} style={{ fontSize: '1.12rem', fontWeight: 900, margin: '0 0 14px', textWrap: 'pretty' }}>
        {t(step.promptKey, step.vars)}
      </h2>

      {step.input === 'tiles' ? (
        <NumberTileStrip
          selected={null}
          checked={false}
          answerValue={step.options[0].value ?? -1}
          onSelect={answer}
          size="large"
          max={tileMax}
          disabledValues={wrongValues}
          ariaKeys={TILE_ARIA_KEYS}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))' }}>
          {step.options.map((option, i) => {
            const rejected = wrongValues.includes(i);
            const { bg, fg, shadow } = answerVisualState(answerRole(false, rejected), rejected, rejected);
            const label = optionLabel(t, option);
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={rejected}
                aria-label={rejected ? t(TILE_ARIA_KEYS.wrong, { value: label }) : label}
                style={{
                  minHeight: 56, padding: '15px 12px', borderRadius: 18, background: bg, color: fg,
                  boxShadow: shadow, fontWeight: 800, fontSize: '1rem',
                  fontFamily: option.label ? MONO : undefined, overflowWrap: 'anywhere',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <p
        role="status"
        style={{ margin: '14px 0 0', fontWeight: 800, fontSize: '0.98rem', minHeight: '1.4em', color: 'var(--destructive)', textWrap: 'pretty' }}
      >
        {statusText}
      </p>
    </div>
  );
}
