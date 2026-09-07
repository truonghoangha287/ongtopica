import { db } from '@/shared/db/db';
import { nextStreak } from '@/math/services/hive-progress';
import { HONEY_PER_HIVE, MS_PER_DAY } from '@/math/constants/math-constants';

/** Honey wallet + streak + daily-goal counter shown across the Math World UI. */
export interface MathEconomy {
  honey: number;
  streak: number;
  hivesToday: number;
}

export const DEFAULT_ECONOMY: MathEconomy = { honey: 0, streak: 0, hivesToday: 0 };

/** Whole-day index of "now", for streak continuity maths. */
export function todayIndex(): number {
  return Math.floor(Date.now() / MS_PER_DAY);
}

/**
 * Award honey and advance the daily streak/goal counter for one completed run.
 * Shared by hive, Olympiad and Number Lab completions so the economy rules live
 * in exactly one place.
 */
export async function awardEconomy(childId: string): Promise<MathEconomy> {
  const econRow = await db.mathProfileState.get(childId);
  const today = todayIndex();
  const honey = (econRow?.honey ?? 0) + HONEY_PER_HIVE;
  const streak = nextStreak(econRow?.streak ?? 0, econRow?.lastActiveDay ?? 0, today);
  // Reset the daily-goal counter when the day rolls over, else increment it.
  const hivesToday = econRow && econRow.lastActiveDay === today ? econRow.hivesToday + 1 : 1;
  await db.mathProfileState.put({
    id: childId,
    childId,
    honey,
    streak,
    lastActiveDay: today,
    hivesToday,
  });
  return { honey, streak, hivesToday };
}
