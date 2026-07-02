import type { Table } from 'dexie';

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

// ---------------------------------------------------------------------------
// Math World (subject: math). Local-first, per-child, no external sync.
// ---------------------------------------------------------------------------

/** Per-child Math World economy (honey wallet + daily streak). */
export interface MathProfileStateRow {
  id: string; // childId
  childId: string;
  honey: number;
  streak: number;
  /** Whole-day index of the last hive completion, for streak continuity. */
  lastActiveDay: number;
  /** Hives completed on `lastActiveDay` (resets when a new day begins). */
  hivesToday: number;
}

/** Per-child, per-topic mastery in the Skills Hive. */
export interface MathTopicProgressRow {
  id: string; // composite: `${childId}:${topicId}`
  childId: string;
  topicId: string;
  stars: 0 | 1 | 2 | 3;
  level: number;
  updatedAt: number;
}

/**
 * Per-child, per-topic, per-level best result. Drives the real journey map so
 * cleared level nodes show the stars actually earned there (not fixed samples).
 */
export interface MathLevelResultRow {
  id: string; // composite: `${childId}:${topicId}:${level}`
  childId: string;
  topicId: string;
  level: number;
  stars: 1 | 2 | 3;
  updatedAt: number;
}

/** Per-child Bee Olympiad state, one row per competition track. */
export interface MathOlympiadStateRow {
  id: string; // composite: `${childId}:${track}`
  childId: string;
  track: string; // 'kangaroo' | 'sasmo'
  /** Best number of puzzles solved in a single daily challenge. */
  solved: number;
  /** Whole-day index of the last attempt. */
  lastDay: number;
  updatedAt: number;
}

export type ChildProfileTable = Table<ChildProfileRow, string>;
export type WordProgressTable = Table<WordProgressRow, string>;
export type WordSetStateTable = Table<WordSetStateRow, string>;
export type AchievementTable = Table<AchievementRow, string>;
export type MathProfileStateTable = Table<MathProfileStateRow, string>;
export type MathTopicProgressTable = Table<MathTopicProgressRow, string>;
export type MathLevelResultTable = Table<MathLevelResultRow, string>;
export type MathOlympiadStateTable = Table<MathOlympiadStateRow, string>;
