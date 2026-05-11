import { SESSION_WORD_COUNT } from '@/shared/constants/game-constants';
import type { Word, WordSet } from '@/shared/types';
import type { WordProgressRow } from '@/shared/db/schema';
import type { SessionItem, ActivityType } from '@/english/vocab/types/vocab.types';

function stageToActivity(stage: number): ActivityType {
  if (stage === 1) return 'introduce';
  if (stage === 2) return 'recognize';
  if (stage === 3) return 'unscramble';
  return 'fill-in-blank';
}

export function selectDistractors(wordId: string, wordSet: WordSet, count: number): Word[] {
  const pool = wordSet.words.filter((w) => w.id !== wordId);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function composeSession(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  options: { sessionWordCount: number } = { sessionWordCount: SESSION_WORD_COUNT }
): SessionItem[] {
  const inProgress = wordSet.words
    .filter((w) => progressMap[w.id])
    .map((w) => ({ word: w, progress: progressMap[w.id] }))
    .sort((a, b) => b.progress.priorityScore - a.progress.priorityScore);

  const items: SessionItem[] = inProgress
    .slice(0, options.sessionWordCount)
    .map(({ word, progress }) => ({
      word,
      activityType: stageToActivity(progress.stage),
    }));

  if (items.length < options.sessionWordCount) {
    const inProgressIds = new Set(inProgress.map((x) => x.word.id));
    const unstarted = wordSet.words.filter((w) => !inProgressIds.has(w.id));
    const needed = options.sessionWordCount - items.length;
    unstarted.slice(0, needed).forEach((word) => {
      items.push({ word, activityType: 'introduce' });
    });
  }

  return items;
}
