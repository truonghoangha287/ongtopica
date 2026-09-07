import { useTranslation } from 'react-i18next';
import { TEN_FRAME_CELLS } from '@/math/constants/math-constants';

interface TenFrameProps {
  /** How many cells to draw filled (0..TEN_FRAME_CELLS). */
  filled: number;
}

const COLUMNS = 5;
const CELL = 34;

/**
 * The classic ten-frame: two rows of five. It makes "how many more to 10?"
 * visible instead of remembered, which is the scaffold the number-bond stage
 * leans on. Announced as a single image so a screen reader hears the count
 * rather than ten empty boxes.
 */
export function TenFrame({ filled }: TenFrameProps) {
  const { t } = useTranslation('math');
  const shown = Math.max(0, Math.min(TEN_FRAME_CELLS, Math.floor(filled)));

  return (
    <div
      role="img"
      aria-label={t('quiz.tenFrameAria', { filled: shown, total: TEN_FRAME_CELLS })}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, ${CELL}px)`,
        gap: 4,
        justifyContent: 'center',
        margin: '0 auto 18px',
        padding: 6,
        borderRadius: 14,
        background: '#fff',
        width: 'fit-content',
        boxShadow: '0 6px 18px -12px rgba(80,60,30,.4)',
      }}
    >
      {Array.from({ length: TEN_FRAME_CELLS }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: 'grid',
            placeItems: 'center',
            width: CELL,
            height: CELL,
            borderRadius: 8,
            border: '2px solid var(--ma-soft)',
            background: i < shown ? 'var(--ma)' : 'transparent',
          }}
        />
      ))}
    </div>
  );
}
