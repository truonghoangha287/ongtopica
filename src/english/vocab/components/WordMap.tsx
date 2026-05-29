import { StarRow, starCount } from '@/english/vocab/components/star-row';
import type { WordMapProps } from '@/english/vocab/types/vocab.types';

export function WordMap({ wordSet, progressMap, onWordTap }: WordMapProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 8,
        padding: 8,
      }}
    >
      {wordSet.words.map((word) => {
        const progress = progressMap[word.id];
        const stars = starCount(progress);
        return (
          <button
            key={word.id}
            onClick={() => onWordTap?.(word)}
            style={{
              position: 'relative',
              padding: 8,
              borderRadius: 8,
              textAlign: 'center',
              border: '2px solid #ddd',
              cursor: onWordTap ? 'pointer' : 'default',
              minHeight: 48,
            }}
            aria-label={`${word.text}${stars === 4 ? ' - mastered' : ''}`}
          >
            <img src={word.pictureAsset} alt={word.text} style={{ width: '100%', borderRadius: 4 }} />
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>{word.text}</div>
            <div style={{ marginTop: 2 }}>
              <StarRow stars={stars} size="sm" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
