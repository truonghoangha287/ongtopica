import { isStepCorrect } from '@/math/services/find-x-steps';
import type { FindXStep, FindXTrailEntry } from '@/math/types/find-x.types';
import type { FindXRunState } from '@/math/services/find-x-run-state';

/**
 * Grading one tap, and the statistics that follow from it. Imports the run's
 * state shape and nothing else of the run, so `find-x-run-queue` and this module
 * never see each other.
 */

/** The trail entry for the option just accepted. */
function entryFor(step: FindXStep, value: number): FindXTrailEntry {
  const option = step.input === 'tiles'
    ? step.options.find((o) => o.correct)!
    : step.options[value];
  return {
    kind: step.kind,
    label: option.label,
    labelKey: option.labelKey,
    vars: option.vars,
    whyKey: option.whyKey,
  };
}

/**
 * Grade a tap on the current step.
 *
 * `asked` and `missed` are booked TOGETHER, when the step completes — never at
 * tap time. A wrong tap only marks the attempt dirty (it lands in `wrongValues`),
 * and the miss is booked with the completion it belongs to. That is what makes
 * `missed[kind] <= asked[kind]` true by construction, for every kind, now and for
 * any kind added later: nothing can increment one without the other.
 *
 * Booking a miss at tap time was wrong twice over. Per tap, one 21-tile compute
 * step absorbed 20 misses against a denominator of 1. Once per step it still
 * broke on miss → "chỉ tôi cách làm" → miss again, the most ordinary struggling
 * flow there is: `reveal` rebuilds the chain and clears `wrongValues`, so the
 * abandoned attempt kept its miss and the rebuilt step booked a second one
 * against a single completion — the parent's line read "Tính đúng −1/1".
 *
 * A step ABANDONED by a reveal therefore counts in neither `asked` nor `missed`:
 * she never finished that decision, so there is no completion to attach it to,
 * and `stats.reveals` already records that she asked for help. A decision re-made
 * inside the revealed chain is booked normally, so a kind can be asked twice in
 * one problem — she really did decide it twice.
 */
export function answerStep(s: FindXRunState, value: number): FindXRunState {
  if (s.done || s.problemComplete) return s;
  const step = s.steps[s.stepIndex];
  if (!step) return s;
  if (s.wrongValues.includes(value)) return s;

  if (!isStepCorrect(step, value)) {
    return { ...s, wrongValues: [...s.wrongValues, value], wrongThisProblem: true };
  }

  const dirty = s.wrongValues.length > 0;
  const stepIndex = s.stepIndex + 1;
  const complete = stepIndex >= s.steps.length;
  const clean = !s.wrongThisProblem && !s.revealed;
  // Past `originalTotal` every problem is a re-ask; a clean finish there is a
  // recovery, a dirty one nothing — it was missed twice.
  const isRecovery = complete && clean && s.pIndex >= s.originalTotal;
  return {
    ...s,
    stepIndex,
    wrongValues: [],
    trail: [...s.trail, entryFor(step, value)],
    problemComplete: complete,
    stats: {
      ...s.stats,
      asked: { ...s.stats.asked, [step.kind]: s.stats.asked[step.kind] + 1 },
      missed: dirty
        ? { ...s.stats.missed, [step.kind]: s.stats.missed[step.kind] + 1 }
        : s.stats.missed,
    },
    mastered: complete ? s.mastered + 1 : s.mastered,
    masteredClean: complete && clean ? s.masteredClean + 1 : s.masteredClean,
    recovered: isRecovery ? s.recovered + 1 : s.recovered,
  };
}
