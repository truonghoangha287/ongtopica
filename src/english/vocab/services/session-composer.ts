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
  options: { sessionWordCount?: number; stageFilter?: number } = {}
): SessionItem[] {
  const limit = options.sessionWordCount ?? SESSION_WORD_COUNT;

  // Stage-filtered mode: only include words at the requested stage
  if (options.stageFilter !== undefined) {
    const targetStage = options.stageFilter;
    const eligible = wordSet.words
      .filter((w) => {
        const p = progressMap[w.id];
        // Stage 1: unstarted words count as stage 1
        return targetStage === 1 ? (!p || p.stage === 1) : (p?.stage === targetStage);
      })
      .sort((a, b) => {
        const pa = progressMap[a.id]?.priorityScore ?? 0;
        const pb = progressMap[b.id]?.priorityScore ?? 0;
        return pb - pa;
      });
    return eligible.slice(0, limit).map((word) => ({
      word,
      activityType: stageToActivity(targetStage),
    }));
  }

  // Default spaced-repetition mode
  const inProgress = wordSet.words
    .filter((w) => progressMap[w.id])
    .map((w) => ({ word: w, progress: progressMap[w.id] }))
    .sort((a, b) => b.progress.priorityScore - a.progress.priorityScore);

  const items: SessionItem[] = inProgress
    .slice(0, limit)
    .map(({ word, progress }) => ({
      word,
      activityType: stageToActivity(progress.stage),
    }));

  if (items.length < limit) {
    const inProgressIds = new Set(inProgress.map((x) => x.word.id));
    const unstarted = wordSet.words.filter((w) => !inProgressIds.has(w.id));
    const needed = limit - items.length;
    unstarted.slice(0, needed).forEach((word) => {
      items.push({ word, activityType: 'introduce' });
    });
  }

  return items;
}
