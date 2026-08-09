import { db } from '@/shared/db/db';
import { useProfileStore } from '@/shared/store/profile-store';
import { applyAttempt, EMPTY_MASTERY } from '@/english/grammar/services/mastery';
import type { MasteryMap, RuleMastery } from '@/english/grammar/services/mastery';
import { RULE_IDS } from '@/english/grammar/data/rules';
import type { RuleId } from '@/english/grammar/data/rules';

const KNOWN_RULE_IDS: ReadonlySet<string> = new Set<string>(RULE_IDS);

export interface UseRuleMasteryReturn {
  /** Every rule this child has attempted, keyed by rule id. */
  getMastery: () => Promise<MasteryMap>;
  /** Record one **first** attempt. Retries within an item must not call this. */
  recordAttempt: (ruleId: RuleId, wasCorrect: boolean) => Promise<void>;
}

export function useRuleMastery(): UseRuleMasteryReturn {
  const activeProfileId = useProfileStore((s) => s.activeProfileId);

  const getMastery = async (): Promise<MasteryMap> => {
    if (!activeProfileId) return {};
    const rows = await db.ruleMastery.where('childId').equals(activeProfileId).toArray();
    const map: MasteryMap = {};
    for (const row of rows) {
      // A rule retired from the catalog leaves its rows behind. Skip them
      // rather than letting a dead id masquerade as a RuleId downstream.
      if (!KNOWN_RULE_IDS.has(row.ruleId)) continue;
      map[row.ruleId as RuleId] = {
        attempts: row.attempts,
        correct: row.correct,
        streak: row.streak,
        gold: row.gold,
      };
    }
    return map;
  };

  const recordAttempt = async (ruleId: RuleId, wasCorrect: boolean): Promise<void> => {
    if (!activeProfileId) return;
    const id = `${activeProfileId}:${ruleId}`;
    // Read-modify-write inside a transaction: the drill engine fires this
    // without awaiting, so two answers on the same rule can overlap. Unguarded,
    // the second read would see the pre-first-write row and lose an attempt.
    await db.transaction('rw', db.ruleMastery, async () => {
      const existing = await db.ruleMastery.get(id);
      const before: RuleMastery = existing
        ? {
            attempts: existing.attempts,
            correct: existing.correct,
            streak: existing.streak,
            gold: existing.gold,
          }
        : EMPTY_MASTERY;
      const after = applyAttempt(before, wasCorrect);
      await db.ruleMastery.put({
        id,
        childId: activeProfileId,
        ruleId,
        ...after,
        lastSeenAt: Date.now(),
      });
    });
  };

  return { getMastery, recordAttempt };
}
