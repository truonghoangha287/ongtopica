import { describe, it, expect } from 'vitest';
import { initFindXRun, findXReducer } from '@/math/services/find-x-run';
import type { FindXRunState } from '@/math/services/find-x-run';
import type { FindXProblem } from '@/math/types/find-x.types';

const P1: FindXProblem = { id: 'r1', form: 'x+a=b', a: 6, b: 14, x: 8 };
const P2: FindXProblem = { id: 'r2', form: 'a-x=b', a: 20, b: 12, x: 8 };

/** A full guided-length run, for the counters that only diverge across a re-ask. */
const SIX: FindXProblem[] = [
  { id: 'q1', form: 'x+a=b', a: 6, b: 14, x: 8 },
  { id: 'q2', form: 'x+a=b', a: 5, b: 12, x: 7 },
  { id: 'q3', form: 'a+x=b', a: 4, b: 11, x: 7 },
  { id: 'q4', form: 'a-x=b', a: 20, b: 12, x: 8 },
  { id: 'q5', form: 'a-x=b', a: 18, b: 11, x: 7 },
  { id: 'q6', form: 'x-a=b', a: 8, b: 5, x: 13 },
];

/** Index of the correct option on the current step (or x, on a tile step). */
function rightValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value!;
  return step.options.findIndex((o) => o.correct);
}

/** Index of a wrong option on the current step. */
function wrongValue(s: FindXRunState): number {
  const step = s.steps[s.stepIndex];
  if (step.input === 'tiles') return step.options.find((o) => o.correct)!.value! + 1;
  return step.options.findIndex((o) => !o.correct);
}

/** Answer every remaining step of the current problem correctly. */
function solveProblem(start: FindXRunState): FindXRunState {
  let s = start;
  while (!s.problemComplete && !s.done) {
    s = findXReducer(s, { type: 'answer', value: rightValue(s) });
  }
  return s;
}

/** Play the current problem to the end and advance, optionally missing once first. */
function play(s: FindXRunState, miss: boolean): FindXRunState {
  const started = miss ? findXReducer(s, { type: 'answer', value: wrongValue(s) }) : s;
  return findXReducer(solveProblem(started), { type: 'next' });
}

describe('find-x run reducer', () => {
  it('starts on the first step of the first problem', () => {
    const s = initFindXRun([P1, P2], 'solo');
    expect(s.pIndex).toBe(0);
    expect(s.stepIndex).toBe(0);
    expect(s.steps[0].kind).toBe('compute');
    expect(s.originalTotal).toBe(2);
    expect(s.done).toBe(false);
  });

  it('advances a step on a correct answer and records the reason in the trail', () => {
    const s = findXReducer(initFindXRun([P1], 'guided'), { type: 'answer', value: rightValue(initFindXRun([P1], 'guided')) });
    expect(s.stepIndex).toBe(1);
    expect(s.trail).toHaveLength(1);
    expect(s.trail[0].kind).toBe('role');
    expect(s.trail[0].whyKey).toBeTruthy();
  });

  it('stays on the step after a wrong answer and remembers the wrong value', () => {
    const start = initFindXRun([P1], 'guided');
    const s = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    expect(s.stepIndex).toBe(0);
    expect(s.trail).toHaveLength(0);
    expect(s.wrongValues).toContain(wrongValue(start));
    expect(s.wrongThisProblem).toBe(true);
  });

  it('clears the wrong values when the step changes', () => {
    const start = initFindXRun([P1], 'guided');
    const missed = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    const moved = findXReducer(missed, { type: 'answer', value: rightValue(missed) });
    expect(moved.wrongValues).toEqual([]);
  });

  it('counts asked and missed per step kind', () => {
    const start = initFindXRun([P1], 'guided');
    const missed = findXReducer(start, { type: 'answer', value: wrongValue(start) });
    const s = solveProblem(missed);
    expect(s.stats.missed.role).toBe(1);
    expect(s.stats.asked.role).toBe(1);
    expect(s.stats.asked.compute).toBe(1);
    expect(s.stats.missed.compute).toBe(0);
  });

  it('counts a step as missed once, however many wrong taps it takes', () => {
    // A compute step is a 21-tile strip against a denominator of 1. Counted per
    // tap, `asked − missed` went negative and the parent's line read `Tính đúng -4/1`.
    let s = initFindXRun([P1], 'solo');
    for (const v of [1, 2, 3, 4, 5]) s = findXReducer(s, { type: 'answer', value: v });
    expect(s.wrongValues).toHaveLength(5);
    expect(s.stats.missed.compute).toBe(1);
    s = solveProblem(s);
    expect(s.stats.asked.compute - s.stats.missed.compute).toBe(0);
  });

  it('counts recovered as R−D, so a problem missed twice recovers nothing', () => {
    // The worked case: 6 problems, #1 and #2 missed, only #1 clean on the re-ask.
    let s = initFindXRun(SIX, 'solo');
    s = play(s, true);                                  // q1 missed
    s = play(s, true);                                  // q2 missed
    for (let i = 0; i < 4; i += 1) s = play(s, false);  // q3..q6 clean
    s = play(s, false);                                 // q1 re-asked, clean — recovered
    s = play(s, true);                                  // q2 re-asked, missed again
    expect(s.done).toBe(true);
    expect(s.recovered).toBe(1);
    // What the page used to pass to the 💪 tile: R+D, three times the truth.
    expect(s.mastered - s.firstPass).toBe(3);
  });

  it('marks the problem complete rather than auto-advancing', () => {
    const s = solveProblem(initFindXRun([P1, P2], 'solo'));
    expect(s.problemComplete).toBe(true);
    expect(s.pIndex).toBe(0);
    expect(findXReducer(s, { type: 'next' }).pIndex).toBe(1);
  });

  it('counts a clean problem as first pass, a missed one as not', () => {
    const clean = solveProblem(initFindXRun([P1], 'solo'));
    expect(clean.firstPass).toBe(1);
    expect(clean.mastered).toBe(1);

    const start = initFindXRun([P1], 'solo');
    const dirty = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    expect(dirty.firstPass).toBe(0);
    expect(dirty.mastered).toBe(1);
  });

  it('requeues a missed problem exactly once', () => {
    const start = initFindXRun([P1, P2], 'solo');
    let s = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.problems).toHaveLength(3); // P1 re-asked at the end
    expect(s.requeuedIds).toEqual([P1.id]);

    // Miss it again on the second look — it must not come back a third time.
    s = solveProblem(s);                       // P2, clean
    s = findXReducer(s, { type: 'next' });     // now on the requeued P1
    s = solveProblem(findXReducer(s, { type: 'answer', value: wrongValue(s) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.problems).toHaveLength(3);
    expect(s.done).toBe(true);
  });

  it('keeps originalTotal at the first-pass length so stars are not diluted', () => {
    const start = initFindXRun([P1, P2], 'solo');
    let s = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    s = findXReducer(s, { type: 'next' });
    expect(s.originalTotal).toBe(2);
  });

  it('reveal expands to the full chain and disqualifies the first pass', () => {
    const start = initFindXRun([P1], 'solo');
    const s = findXReducer(start, { type: 'reveal' });
    expect(s.revealed).toBe(true);
    expect(s.steps.map((x) => x.kind)).toEqual(['role', 'operation', 'operands', 'compute', 'check']);
    expect(s.stepIndex).toBe(0);
    expect(s.stats.reveals).toBe(1);
    expect(solveProblem(s).firstPass).toBe(0);
  });

  it('replaces the whole run on load', () => {
    const s = findXReducer(initFindXRun([], 'guided'), { type: 'load', problems: [P1], level: 'solo' });
    expect(s.level).toBe('solo');
    expect(s.originalTotal).toBe(1);
    expect(s.done).toBe(false);
    expect(s.steps[0].kind).toBe('compute');
  });

  it('ignores answers once the run is done', () => {
    let s = solveProblem(initFindXRun([P1], 'solo'));
    s = findXReducer(s, { type: 'next' });
    expect(s.done).toBe(true);
    expect(findXReducer(s, { type: 'answer', value: 0 })).toBe(s);
  });
});
