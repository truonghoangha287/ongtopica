import { describe, it, expect } from 'vitest';
import { makeRng } from '@/english/grammar/services/rng';
import { selectRules } from '@/english/grammar/services/rule-scheduler';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap } from '@/english/grammar/services/mastery';
import { PLURALS_GAME } from '@/english/grammar/services/games';

/** Play `rounds` questions, answering `wrongRule` wrongly and the rest right. */
function simulate(rounds: number, wrongRule: string, seed: number): MasteryMap {
  let mastery: MasteryMap = {};
  let rng = makeRng(seed);
  for (let session = 0; session < rounds; session++) {
    const rules = selectRules(PLURALS_GAME.rules, mastery, 10, rng);
    const next: MasteryMap = { ...mastery };
    for (const rule of rules) {
      const wasCorrect = rule !== wrongRule;
      next[rule] = applyAttempt(next[rule] ?? EMPTY_MASTERY, wasCorrect);
    }
    mastery = next;
    rng = makeRng(seed + session + 1);
  }
  return mastery;
}

describe('adaptive drilling', () => {
  it('drills a rule the child keeps getting wrong more than the others', () => {
    const mastery = simulate(8, 'plural.es', 100);

    const rules = selectRules(PLURALS_GAME.rules, mastery, 300, makeRng(999));
    const esCount = rules.filter((r) => r === 'plural.es').length;
    const evenShare = 300 / PLURALS_GAME.rules.length;

    expect(esCount).toBeGreaterThan(evenShare);
  });

  it('turns consistently-correct rules gold', () => {
    const mastery = simulate(10, 'plural.es', 100);
    const golds = Object.entries(mastery).filter(([, m]) => m?.gold);
    expect(golds.length).toBeGreaterThan(0);
    expect(mastery['plural.es']?.gold).toBe(false);
  });

  it('keeps mastered rules in rotation rather than dropping them', () => {
    const mastery = simulate(10, 'plural.es', 100);
    const rules = selectRules(PLURALS_GAME.rules, mastery, 300, makeRng(7));
    for (const ruleId of PLURALS_GAME.rules) {
      expect(rules, `${ruleId} vanished from rotation`).toContain(ruleId);
    }
  });

  it('builds a real item for every rule the scheduler picks', () => {
    const mastery = simulate(5, 'plural.ies', 55);
    const rng = makeRng(31);
    const rules = selectRules(PLURALS_GAME.rules, mastery, 40, rng);
    for (const rule of rules) {
      expect(PLURALS_GAME.buildItem(rule, rng), `no item for ${rule}`).not.toBeNull();
    }
  });
});
