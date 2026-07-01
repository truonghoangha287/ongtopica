import type { Table } from 'dexie';

/**
 * Dexie store definitions per schema version. Defined here (no Dexie instance)
 * so the additive-migration invariant (FR-012: adding Math must not drop or alter
 * the English tables) can be asserted in tests without a real IndexedDB.
 */
export const SCHEMA_V1: Record<string, string> = {
  childProfiles: 'id, createdAt',
  wordProgress: 'id, childId, [childId+wordSetId], [childId+stage]',
};

export const SCHEMA_V2: Record<string, string> = {
  ...SCHEMA_V1,
  wordSetState: 'id, childId, [childId+wordSetId]',
  achievements: 'id, childId, [childId+earnedAt]',
};

export const SCHEMA_V3: Record<string, string> = {
  ...SCHEMA_V2,
  // v3 — additive: the Math subject's per-problem progress table.
  mathProgress: 'id, childId, [childId+topicId]',
};

export interface ChildProfileRow {
  id: string;
  name: string;
  avatarId: string;
  createdAt: number;
}

export interface WordProgressRow {
  id: string; // composite: `${childId}:${wordId}`
  childId: string;
  wordId: string;
  wordSetId: string;
  stage: 1 | 2 | 3 | 4;
  consecutiveCorrect: number;
  totalIncorrect: number;
  priorityScore: number;
  lastReviewedAt: number;
  introducedAt?: number | null; // NEW: timestamp when first L&L session containing this word completed
}

export interface WordSetStateRow {
  id: string;          // composite: `${childId}:${wordSetId}`
  childId: string;
  wordSetId: string;
  rotationCursor: number; // 0-based index into wordSet.words; next L&L batch starts here
  lastUpdatedAt: number;
}

export interface AchievementRow {
  id: string;          // composite: `${childId}:${achievementId}`
  childId: string;
  achievementId: string; // e.g. 'first_listen', 'curious_ear:animals'
  earnedAt: number;
}

export interface MathProgressRow {
  id: string;          // composite: `${childId}:${problemId}`
  childId: string;
  topicId: string;
  problemId: string;
  consecutiveCorrect: number;
  totalIncorrect: number;
  mastered: boolean;   // set true once consecutiveCorrect reaches MATH_MASTERY_THRESHOLD
  lastReviewedAt: number;
}

export type ChildProfileTable = Table<ChildProfileRow, string>;
export type WordProgressTable = Table<WordProgressRow, string>;
export type WordSetStateTable = Table<WordSetStateRow, string>;
export type AchievementTable = Table<AchievementRow, string>;
export type MathProgressTable = Table<MathProgressRow, string>;
