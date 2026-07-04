import { starCount } from '@/english/vocab/components/star-row';
import type { WordProgressRow } from '@/shared/db/schema';
import type { WordSet } from '@/shared/types';

interface HomeProgressTileProps {
  wordSet: WordSet;
  progressMap: Record<string, WordProgressRow>;
}

/**
 * Visual star-progress bar for a WordSet tile on Home. Numbers mean little to a
 * 6-year-old, so we show a filling bar; the exact count stays in the aria-label.
 * Each word is worth 4 stars; total possible = wordSet.words.length * 4.
 */
export function HomeProgressTile({ wordSet, progressMap }: HomeProgressTileProps) {
  const earned = wordSet.words.reduce(
    (sum, w) => sum + starCount(progressMap[w.id]),
    0,
  );
  const total = wordSet.words.length * 4;
  const pct = total ? Math.round((earned / total) * 100) : 0;

  return (
    <span
      aria-label={`${earned} of ${total} stars earned`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}
    >
      <span aria-hidden="true" style={{ color: 'var(--star)', fontSize: '1rem', lineHeight: 1 }}>★</span>
      <span className="progress" style={{ height: 8, flex: 1 }}>
        <i style={{ width: `${pct}%`, background: 'var(--star)' }} />
      </span>
    </span>
  );
}
