interface ObjectClusterProps {
  emoji: string;
  count: number;
  /** Font size of each object glyph. */
  glyphSize?: string;
}

/**
 * Renders `count` copies of an emoji in a wrapping grid — the concrete quantity
 * a child counts. Decorative at the glyph level; the surrounding prompt/caption
 * carries the accessible question text, and the count is announced via aria-label.
 */
export function ObjectCluster({ emoji, count, glyphSize = '2.6rem' }: ObjectClusterProps) {
  return (
    <div
      role="img"
      aria-label={`${count}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: 340,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i} aria-hidden="true" style={{ fontSize: glyphSize, lineHeight: 1 }}>
          {emoji}
        </span>
      ))}
    </div>
  );
}
