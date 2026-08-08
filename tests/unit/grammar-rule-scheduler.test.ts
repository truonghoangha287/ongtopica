import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap, RuleMastery } from '@/english/grammar/services/mastery';
import {
  ruleWeight,
  selectRules,
  breakRuns,
  WEIGHT_UNSEEN,
  WEIGHT_WEAK,
  WEIGHT_LEARNING,
  WEIGHT_GOLD,
} from '@/english/grammar/services/rule-scheduler';
import type { RuleId } from '@/english/grammar/data/rules';

const run = (results: boolean[]): RuleMastery =>
  results.reduce((m, c) => applyAttempt(m, c), EMPTY_MASTERY);

const GOLD = run([false, false, ...Array(8).fill(true)]);
const WEAK = run([false, false, false, true]);
const LEARNING = run([true, true, true, false, true]);

describe('ruleWeight', () => {
  it('weights an unseen rule for establishing', () => {
    expect(ruleWeight(undefined)).toBe(WEIGHT_UNSEEN);
  });

  it('weights a weak rule highest', () => {
    expect(ruleWeight(WEAK)).toBe(WEIGHT_WEAK);
  });

  it('weights a healthy learning rule in the middle', () => {
    expect(ruleWeight(LEARNING)).toBe(WEIGHT_LEARNING);
  });

  it('weights a gold rule lowest but never zero', () => {
    expect(ruleWeight(GOLD)).toBe(WEIGHT_GOLD);
    expect(WEIGHT_GOLD).toBeGreaterThan(0);
  });

  it('prefers weak over gold for a slipping gold rule', () => {
    let m = GOLD;
    for (let i = 0; i < 12; i++) m = applyAttempt(m, false);
    expect(ruleWeight(m)).toBe(WEIGHT_WEAK);
  });
});

describe('selectRules', () => {
  const rules: RuleId[] = ['plural.s', 'plural.es', 'plural.ies'];

  it('returns exactly `count` rules', () => {
    expect(selectRules(rules, {}, 10, makeRng(1))).toHaveLength(10);
  });

  it('only returns rules it was given', () => {
    for (const r of selectRules(rules, {}, 10, makeRng(2))) {
      expect(rules).toContain(r);
    }
  });

  it('returns an empty list when given no rules', () => {
    expect(selectRules([], {}, 10, makeRng(3))).toEqual([]);
  });

  it('is deterministic for a given seed', () => {
    expect(selectRules(rules, {}, 10, makeRng(5)))
      .toEqual(selectRules(rules, {}, 10, makeRng(5)));
  });

  it('drills the weak rule markedly more than the gold ones', () => {
    const mastery: MasteryMap = {
      'plural.s': GOLD,
      'plural.es': WEAK,
      'plural.ies': GOLD,
    };
    const picked = selectRules(rules, mastery, 200, makeRng(11));
    const weakCount = picked.filter((r) => r === 'plural.es').length;
    expect(weakCount).toBeGreaterThan(100);
  });

  it('still surfaces gold rules occasionally', () => {
    const mastery: MasteryMap = {
      'plural.s': GOLD,
      'plural.es': WEAK,
      'plural.ies': GOLD,
    };
    const picked = selectRules(rules, mastery, 200, makeRng(12));
    expect(picked.filter((r) => r === 'plural.s').length).toBeGreaterThan(0);
  });

  it('never repeats the same rule three times in a row', () => {
    const picked = selectRules(rules, {}, 60, makeRng(13));
    for (let i = 2; i < picked.length; i++) {
      const threePeat = picked[i] === picked[i - 1] && picked[i - 1] === picked[i - 2];
      expect(threePeat, `three-in-a-row at index ${i}`).toBe(false);
    }
  });

  it('tolerates a single-rule game without hanging', () => {
    const picked = selectRules(['letter.bd'], {}, 10, makeRng(14));
    expect(picked).toEqual(Array(10).fill('letter.bd'));
  });
});

describe('breakRuns', () => {
  it('breaks up a three-in-a-row when an alternative exists', () => {
    const out = breakRuns(['a', 'a', 'a', 'b'] as unknown as RuleId[], makeRng(1));
    expect(out).toHaveLength(4);
    for (let i = 2; i < out.length; i++) {
      expect(out[i] === out[i - 1] && out[i - 1] === out[i - 2]).toBe(false);
    }
  });

  it('preserves the multiset of rules', () => {
    const input = ['a', 'a', 'a', 'b', 'b'] as unknown as RuleId[];
    const out = breakRuns(input, makeRng(2));
    expect([...out].sort()).toEqual([...input].sort());
  });
});
