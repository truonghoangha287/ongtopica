import { ACHIEVEMENT_IDS, MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';
import type { WordSet } from '@/shared/types';

/**
 * Pure function — no side effects, no Dexie.
 * Returns array of newly-earned achievement IDs given the current state.
 * Caller is responsible for persisting and triggering celebrations.
 */
export function evaluateAchievements(
  progressMap: Record<string, WordProgressRow>,
  wordSets: WordSet[],
  earnedIds: Set<string>,
): string[] {
  const newlyEarned: string[] = [];

  const earn = (id: string) => {
    if (!earnedIds.has(id)) newlyEarned.push(id);
  };

  const values = Object.values(progressMap);

  // first_listen: heard at least 1 word across any set
  if (values.some((p) => p.introducedAt != null)) {
    earn(ACHIEVEMENT_IDS.FIRST_LISTEN);
  }

  for (const ws of wordSets) {
    const wsProgress = ws.words.map((w) => progressMap[w.id]);

    // curious_ear:{setId} — every word in the set has introducedAt set
    const allIntroduced = ws.words.every((w) => progressMap[w.id]?.introducedAt != null);
    if (allIntroduced) {
      earn(`${ACHIEVEMENT_IDS.CURIOUS_EAR}:${ws.id}`);
    }

    // sharp_eye:{setId} — every word at stage >= 2 (cleared Recognize)
    const allRecognized = ws.words.every((w) => (progressMap[w.id]?.stage ?? 1) >= 2);
    if (allRecognized) {
      earn(`${ACHIEVEMENT_IDS.SHARP_EYE}:${ws.id}`);
    }

    // word_builder:{setId} — every word at stage >= 3 (cleared Unscramble)
    const allSpelled = ws.words.every((w) => (progressMap[w.id]?.stage ?? 1) >= 3);
    if (allSpelled) {
      earn(`${ACHIEVEMENT_IDS.WORD_BUILDER}:${ws.id}`);
    }

    // set_master:{setId} — every word at stage 4 with consecutiveCorrect >= MASTERY_THRESHOLD
    const allMastered = ws.words.every((w) => {
      const p = progressMap[w.id];
      return p && p.stage === 4 && p.consecutiveCorrect >= MASTERY_THRESHOLD;
    });
    if (allMastered) {
      earn(`${ACHIEVEMENT_IDS.SET_MASTER}:${ws.id}`);
    }

    // Suppress unused variable warning — wsProgress used for set-level checks above
    void wsProgress;
  }

  return newlyEarned;
}

/** Human-readable label for an achievement ID, used on the Achievements screen. */
export function achievementLabel(achievementId: string): { nameKey: string; hintKey: string } {
  if (achievementId === ACHIEVEMENT_IDS.FIRST_LISTEN) {
    return { nameKey: 'achievements.firstListen.name', hintKey: 'achievements.firstListen.hint' };
  }
  if (achievementId.startsWith(ACHIEVEMENT_IDS.CURIOUS_EAR)) {
    return { nameKey: 'achievements.curiousEar.name', hintKey: 'achievements.curiousEar.hint' };
  }
  if (achievementId.startsWith(ACHIEVEMENT_IDS.SHARP_EYE)) {
    return { nameKey: 'achievements.sharpEye.name', hintKey: 'achievements.sharpEye.hint' };
  }
  if (achievementId.startsWith(ACHIEVEMENT_IDS.WORD_BUILDER)) {
    return { nameKey: 'achievements.wordBuilder.name', hintKey: 'achievements.wordBuilder.hint' };
  }
  return { nameKey: 'achievements.setMaster.name', hintKey: 'achievements.setMaster.hint' };
}
