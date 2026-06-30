interface StarRowProps {
  stars: 0 | 1 | 2 | 3 | 4;
  max?: number;
  size?: 'sm' | 'md';
}

const SIZE_MAP = { sm: '0.9rem', md: '1.3rem' };

/**
 * Renders a row of up to `max` stars (default 4), filling `stars` of them.
 * aria-label: "{stars} of {max} stars earned"
 */
export function StarRow({ stars, max = 4, size = 'sm' }: StarRowProps) {
  const fontSize = SIZE_MAP[size];
  return (
    <span
      aria-label={`${stars} of ${max} stars earned`}
      style={{ display: 'inline-flex', gap: 1, lineHeight: 1 }}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ fontSize, color: i < stars ? 'var(--star)' : 'var(--border)' }}
        >
          {i < stars ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

/**
 * Pure helper: derive star count from a word's progress record.
 * 0 = never heard, 1 = introduced (L&L done), 2-4 = stage 2/3/4 cleared.
 */
export function starCount(progress?: {
  stage: 1 | 2 | 3 | 4;
  introducedAt?: number | null;
}): 0 | 1 | 2 | 3 | 4 {
  if (!progress) return 0;
  if (progress.stage >= 2) return progress.stage as 2 | 3 | 4;
  if (progress.introducedAt != null) return 1;
  return 0;
}
