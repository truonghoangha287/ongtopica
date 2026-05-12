import type { Word } from '@/shared/types';

interface WordCardProps {
  word: Word;
}

export function WordCard({ word }: WordCardProps) {
  return (
    <div role="img" aria-label={word.text} style={{ textAlign: 'center' }}>
      <img
        src={word.pictureAsset}
        alt={word.text}
        style={{ width: '100%', maxWidth: 280, borderRadius: 12 }}
      />
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{word.text}</p>
    </div>
  );
}
