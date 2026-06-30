import type { Word } from '@/shared/types';

interface WordCardProps {
  word: Word;
}

export function WordCard({ word }: WordCardProps) {
  return (
    <div role="img" aria-label={word.text} style={{ textAlign: 'center' }}>
      <div
        className="card"
        style={{ display: 'grid', placeItems: 'center', width: 280, height: 280, padding: 24, margin: '0 auto' }}
      >
        <img
          src={word.pictureAsset}
          alt={word.text}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
      <p style={{ fontSize: '2.6rem', fontWeight: 800, margin: '18px 0 0' }}>{word.text}</p>
    </div>
  );
}
