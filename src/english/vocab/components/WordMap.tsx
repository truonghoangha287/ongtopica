import { StarRow, starCount } from '@/english/vocab/components/star-row';
import type { WordMapProps } from '@/english/vocab/types/vocab.types';

export function WordMap({ wordSet, progressMap, onWordTap }: WordMapProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 12,
      }}
    >
      {wordSet.words.map((word) => {
        const progress = progressMap[word.id];
        const stars = starCount(progress);
        return (
          <button
            key={word.id}
            className="card"
            onClick={() => onWordTap?.(word)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: 14,
              cursor: onWordTap ? 'pointer' : 'default',
            }}
            aria-label={`${word.text}${stars === 4 ? ' - mastered' : ''}`}
          >
            <img src={word.pictureAsset} alt={word.text} style={{ width: 56, height: 56, objectFit: 'contain' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{word.text}</div>
            <StarRow stars={stars} size="sm" />
          </button>
        );
      })}
    </div>
  );
}
