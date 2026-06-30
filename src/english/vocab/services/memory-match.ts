import { seededShuffle } from '@/shared/utils/seeded-shuffle';
import type { Word, WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';

export type MemoryCardKind = 'picture' | 'word';

export interface MemoryCard {
  /** Stable id for React keys and flip tracking. */
  id: string;
  /** The word this card belongs to; a pair shares the same wordId. */
  wordId: string;
  kind: MemoryCardKind;
  word: Word;
}

/**
 * Pick the words a Memory Match game is played over: prefer already-introduced
 * words, falling back to the start of the set so a game is always playable.
 */
export function pickMemoryWords(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  pairs: number,
): Word[] {
  const introduced = wordSet.words.filter(
    (w) => (progressMap[w.id]?.introducedAt ?? null) !== null,
  );
  const pool = introduced.length >= pairs ? introduced : wordSet.words;
  return pool.slice(0, Math.min(pairs, pool.length));
}

/**
 * Build a shuffled deck of picture/word cards (two cards per word). Seeded so a
 * given (game) seed is reproducible — handy for tests and stable first paint.
 */
export function buildMemoryDeck(words: Word[], seed: string): MemoryCard[] {
  const cards: MemoryCard[] = [];
  for (const word of words) {
    cards.push({ id: `${word.id}:picture`, wordId: word.id, kind: 'picture', word });
    cards.push({ id: `${word.id}:word`, wordId: word.id, kind: 'word', word });
  }
  return seededShuffle(cards, seed);
}
