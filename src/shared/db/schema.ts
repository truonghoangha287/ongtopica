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

export type ChildProfileTable = Table<ChildProfileRow, string>;
export type WordProgressTable = Table<WordProgressRow, string>;
export type WordSetStateTable = Table<WordSetStateRow, string>;
export type AchievementTable = Table<AchievementRow, string>;
