import type { Word, WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

export type ActivityType = 'introduce' | 'recognize' | 'unscramble' | 'fill-in-blank';

export interface SessionItem {
  word: Word;
  activityType: ActivityType;
}

export interface Session {
  id: string;
  wordSetId: string;
  items: SessionItem[];
  createdAt: number;
}

export interface ActivityCallbacks {
  onCorrect: () => void;
  onIncorrect: () => void;
  onReveal: () => void;
  onAdvance: () => void;
}

export interface IntroduceActivityProps {
  word: Word;
  onComplete: () => void;
}

export interface RecognizeActivityProps {
  word: Word;
  distractors: Word[];
  callbacks: ActivityCallbacks;
}

export interface UnscrambleActivityProps {
  word: Word;
  callbacks: ActivityCallbacks;
}

export interface FillInBlankActivityProps {
  word: Word;
  callbacks: ActivityCallbacks;
}

export interface SessionPlayerProps {
  session: Session;
  onSessionComplete: () => void;
  onExit: () => void;
}

export interface WordMapProps {
  wordSet: WordSet;
  progressMap: Record<string, WordProgressRow>;
  onWordTap?: (word: Word) => void;
}
