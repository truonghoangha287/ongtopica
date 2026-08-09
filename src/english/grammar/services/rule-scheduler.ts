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
 * Reorder so no rule appears three times consecutively.
 *
 * Emits from scratch, each step taking the rule with the most occurrences left
 * that would not form a three-run. Choosing the most-frequent rule first is what
 * prevents a surplus rule being stranded at the tail — the failure mode a
 * forward-only swap cannot fix. When every remaining rule is banned (a
 * single-rule game, or a rule so dominant that spacing is impossible) the ban is
 * dropped for that slot rather than dropping the item.
 */
export function breakRuns(list: RuleId[], rng: Rng): RuleId[] {
  const counts = new Map<RuleId, number>();
  for (const id of list) counts.set(id, (counts.get(id) ?? 0) + 1);

  const out: RuleId[] = [];
  for (let i = 0; i < list.length; i++) {
    const prev1 = out[out.length - 1];
    const prev2 = out[out.length - 2];
    const banned = prev1 !== undefined && prev1 === prev2 ? prev1 : undefined;

    let candidates = [...counts.entries()].filter(([id, n]) => n > 0 && id !== banned);
    // Only a single rule remains (or it is the sole rule in the game) — a
    // three-run is unavoidable, so allow it rather than emit nothing.
    if (candidates.length === 0) {
      candidates = [...counts.entries()].filter(([, n]) => n > 0);
    }

    const max = Math.max(...candidates.map(([, n]) => n));
    const top = candidates.filter(([, n]) => n === max);
    const [chosen] = top[Math.floor(rng() * top.length)];

    out.push(chosen);
    counts.set(chosen, (counts.get(chosen) as number) - 1);
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
