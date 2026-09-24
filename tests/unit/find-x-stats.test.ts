import { describe, it, expect } from 'vitest';
import { initFindXRun, findXReducer } from '@/math/services/find-x-run';
import { P1, SIX, play, rightValue, solveProblem, wrongValue } from '../find-x-run-helpers';

/**
 * The counters, split out from the queue tests: `asked` / `missed` per decision —
 * what the parent's one line on the reward screen is built from — plus
 * `mastered`, `masteredClean` and `recovered`.
 */
describe('find-x run statistics', () => {
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
    // Nothing is booked yet: a miss belongs to the completion it happened on.
    expect(s.stats.missed.compute).toBe(0);
    s = solveProblem(s);
    expect(s.stats.missed.compute).toBe(1);
    expect(s.stats.asked.compute - s.stats.missed.compute).toBe(0);
  });

  it('books a miss with the completion it belongs to, so a reveal cannot double-count it', () => {
    // Miss, ask to be shown how, miss again — the most ordinary struggling flow.
    // `reveal` rebuilds the chain and clears `wrongValues`, so a miss booked at tap
    // time survived onto a step that never completed and the rebuilt step booked a
    // second one: `missed.compute` 2 against `asked.compute` 1, i.e. `Tính đúng −1/1`.
    let s = initFindXRun([P1], 'solo');
    s = findXReducer(s, { type: 'answer', value: 1 });          // wrong tile on compute
    s = findXReducer(s, { type: 'reveal' });                    // abandons that attempt
    expect(s.steps.map((x) => x.kind)).toEqual(['role', 'operation', 'operands', 'compute', 'check']);
    while (!s.problemComplete) {
      // Miss the compute step once inside the revealed chain, then answer it.
      if (s.steps[s.stepIndex].kind === 'compute' && s.wrongValues.length === 0) {
        s = findXReducer(s, { type: 'answer', value: 1 });
        continue;
      }
      s = findXReducer(s, { type: 'answer', value: rightValue(s) });
    }
    // One compute decision completed, and it was missed: exactly 1/1, never 2/1.
    expect(s.stats.asked.compute).toBe(1);
    expect(s.stats.missed.compute).toBe(1);
    // The abandoned attempt counts in neither column — `reveals` is what records it.
    expect(s.stats.reveals).toBe(1);
    // The guarantee, across every kind: `missed` can never outrun `asked`.
    for (const kind of Object.keys(s.stats.asked) as (keyof typeof s.stats.asked)[]) {
      expect(s.stats.missed[kind], kind).toBeLessThanOrEqual(s.stats.asked[kind]);
    }
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
    expect(s.mastered - s.masteredClean).toBe(3);
  });

  it('counts a clean problem as mastered-clean, a missed one as not', () => {
    const clean = solveProblem(initFindXRun([P1], 'solo'));
    expect(clean.masteredClean).toBe(1);
    expect(clean.mastered).toBe(1);

    const start = initFindXRun([P1], 'solo');
    const dirty = solveProblem(findXReducer(start, { type: 'answer', value: wrongValue(start) }));
    expect(dirty.masteredClean).toBe(0);
    expect(dirty.mastered).toBe(1);
  });

  it('counts a clean RE-ASK as mastered-clean too, which is what stars are scored on', () => {
    // Not an oversight: the sibling pillar scores `correct + recovered`
    // (`NumberLabQuizPage`), so a child who puts her mistake right has earned the
    // star. Adding a `pIndex < originalTotal` guard here would break that.
    let s = initFindXRun([P1, SIX[1]], 'solo');
    s = play(s, true);            // P1 missed on the first pass
    s = play(s, false);           // the other one, clean
    expect(s.masteredClean).toBe(1);
    s = play(s, false);           // P1 re-asked and put right
    expect(s.masteredClean).toBe(2);
    expect(s.recovered).toBe(1);
  });
});
