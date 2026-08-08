import type { RuleId } from '@/english/grammar/data/rules';
import type { Rng } from './rng';
import { isUnseen, isWeak } from './mastery';
import type { MasteryMap, RuleMastery } from './mastery';

/**
 * Picks which rules a session drills. Weighted sampling toward the rules the
 * child is getting wrong, so rounds are not spent re-teaching what they already
 * know — the whole reason this track tracks anything at all.
 */

export const WEIGHT_UNSEEN = 3;
export const WEIGHT_WEAK = 5;
export const WEIGHT_LEARNING = 2;
/** Never 0: mastered rules must resurface occasionally or they decay unseen. */
export const WEIGHT_GOLD = 1;

export function ruleWeight(m: RuleMastery | undefined): number {
  if (isUnseen(m)) return WEIGHT_UNSEEN;
  // Weak is checked before gold: gold is sticky, but a slipping gold rule
  // should still be drilled hard.
  if (isWeak(m)) return WEIGHT_WEAK;
  if (m?.gold) return WEIGHT_GOLD;
  return WEIGHT_LEARNING;
}

/**
 * Reorder so no rule appears three times consecutively. Swaps the offending
 * item with a later, different one; leaves the list alone when no such item
 * exists (e.g. a single-rule game).
 */
export function breakRuns(list: RuleId[], rng: Rng): RuleId[] {
  let out = [...list];
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 2; i < out.length; i++) {
      if (out[i] !== out[i - 1] || out[i - 1] !== out[i - 2]) continue;
      const options: number[] = [];
      for (let j = i + 1; j < out.length; j++) {
        if (out[j] !== out[i]) options.push(j);
      }
      if (options.length === 0) continue;
      const j = options[Math.floor(rng() * options.length)];
      [out[i], out[j]] = [out[j], out[i]];
      changed = true;
    }
  }
  return out;
}

/** `count` rules, weighted by mastery, with three-in-a-row runs broken up. */
export function selectRules(
  ruleIds: RuleId[],
  mastery: MasteryMap,
  count: number,
  rng: Rng,
): RuleId[] {
  if (ruleIds.length === 0 || count <= 0) return [];

  const weights = ruleIds.map((id) => ruleWeight(mastery[id]));
  const total = weights.reduce((sum, w) => sum + w, 0);

  const picked: RuleId[] = [];
  for (let i = 0; i < count; i++) {
    let roll = rng() * total;
    let chosen = ruleIds[ruleIds.length - 1];
    for (let j = 0; j < ruleIds.length; j++) {
      roll -= weights[j];
      if (roll <= 0) {
        chosen = ruleIds[j];
        break;
      }
    }
    picked.push(chosen);
  }
  return breakRuns(picked, rng);
}
