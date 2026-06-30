import { SESSION_WORD_COUNT } from '@/shared/constants/game-constants';
import { buildBatchIndices } from '@/english/vocab/services/rotation-cursor';
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

/**
 * Compose a Listen & Match practice session.
 *
 * Listening practice over already-introduced words (those with `introducedAt`
 * set). If fewer than two words have been introduced yet, fall back to the full
 * set so the activity is always playable. Order is shuffled.
 */
export function composeListenMatchSession(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  limit: number,
): SessionItem[] {
  const introduced = wordSet.words.filter(
    (w) => (progressMap[w.id]?.introducedAt ?? null) !== null,
  );
  const pool = introduced.length >= 2 ? introduced : wordSet.words;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit).map((word) => ({
    word,
    activityType: 'listen-match' as ActivityType,
  }));
}

/**
 * Compose a session from a WordSet and progress map.
 *
 * Mode A (stageFilter === 1): Listen & Learn rotation using rotationCursor.
 * Mode B (stageFilter 2-4): Eligible pool = words at stage >= stageFilter, sorted by priorityScore desc.
 * Mode C (no stageFilter): Spaced-repetition fill of in-progress words, topped up with unstarted.
 */
export function composeSession(
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
  options: {
    sessionWordCount?: number;
    stageFilter?: 1 | 2 | 3 | 4;
    rotationCursor?: number;
  } = {},
): SessionItem[] {
  const limit = options.sessionWordCount ?? SESSION_WORD_COUNT;

  // Mode A — Listen & Learn rotation
  if (options.stageFilter === 1) {
    const cursor = options.rotationCursor ?? 0;
    const introducedFlags = wordSet.words.map(
      (w) => (progressMap[w.id]?.introducedAt ?? null) !== null,
    );
    const indices = buildBatchIndices(cursor, wordSet.words.length, introducedFlags, limit);
    return indices.map((i) => ({
      word: wordSet.words[i],
      activityType: 'introduce' as ActivityType,
    }));
  }

  // Mode B — Higher-stage activity (stage >= stageFilter)
  if (options.stageFilter !== undefined) {
    const targetStage = options.stageFilter;
    const eligible = wordSet.words
      .filter((w) => {
        const stage = progressMap[w.id]?.stage ?? 1;
        return stage >= targetStage;
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

  // Mode C — Default spaced-repetition
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
