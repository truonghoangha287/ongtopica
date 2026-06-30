import { starCount } from '@/english/vocab/components/star-row';
import type { WordProgressRow } from '@/shared/db/schema';
import type { WordSet } from '@/shared/types';

interface HomeProgressTileProps {
  wordSet: WordSet;
  progressMap: Record<string, WordProgressRow>;
}

/**
 * Compact "X / Y" earned-stars indicator for a WordSet tile on Home.
 * Each word is worth 4 stars; total possible = wordSet.words.length * 4.
 */
export function HomeProgressTile({ wordSet, progressMap }: HomeProgressTileProps) {
  const earned = wordSet.words.reduce(
    (sum, w) => sum + starCount(progressMap[w.id]),
    0,
  );
  const total = wordSet.words.length * 4;

  return (
    <span className="badge" aria-label={`${earned} of ${total} stars earned`}>
      {earned} / {total}
      <span aria-hidden="true" style={{ color: 'var(--star)' }}>★</span>
    </span>
  );
}
