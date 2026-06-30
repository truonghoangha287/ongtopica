import type { Word } from '@/shared/types';

interface WordCardProps {
  word: Word;
  /** When set, the picture becomes a button that replays the word audio. */
  onReplay?: () => void;
  replayLabel?: string;
}

export function WordCard({ word, onReplay, replayLabel }: WordCardProps) {
  const imageBox = (
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
  );

  const caption = (
    <p style={{ fontSize: '2.6rem', fontWeight: 800, margin: '18px 0 0' }}>{word.text}</p>
  );

  // Tappable variant: keep the caption OUTSIDE the button so the picture's alt
  // text isn't flagged as redundant with the visible word.
  if (onReplay) {
    return (
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onReplay}
          aria-label={replayLabel ?? word.text}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'block', margin: '0 auto' }}
        >
          {imageBox}
        </button>
        {caption}
      </div>
    );
  }

  return (
    <div role="img" aria-label={word.text} style={{ textAlign: 'center' }}>
      {imageBox}
      {caption}
    </div>
  );
}
