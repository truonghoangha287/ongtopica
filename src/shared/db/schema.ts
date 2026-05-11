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
}

export type ChildProfileTable = Table<ChildProfileRow, string>;
export type WordProgressTable = Table<WordProgressRow, string>;
