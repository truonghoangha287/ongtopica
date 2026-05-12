import { MASTERY_THRESHOLD } from '@/shared/constants/game-constants';
import type { WordMapProps } from '@/english/vocab/types/vocab.types';
import type { Word } from '@/shared/types';

export function WordMap({ wordSet, progressMap, onWordTap }: WordMapProps) {
  const isMastered = (word: Word) => {
    const p = progressMap[word.id];
    return p && p.stage === 4 && p.consecutiveCorrect >= MASTERY_THRESHOLD;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 8,
        padding: 8,
      }}
    >
      {wordSet.words.map((word) => (
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
          aria-label={`${word.text}${isMastered(word) ? ' - mastered' : ''}`}
        >
          <img src={word.pictureAsset} alt={word.text} style={{ width: '100%', borderRadius: 4 }} />
          <div style={{ fontSize: '0.8rem', marginTop: 4 }}>{word.text}</div>
          {isMastered(word) && (
            <span
              style={{ position: 'absolute', top: -8, right: -8, fontSize: '1.2rem' }}
              aria-hidden="true"
            >
              ⭐
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
