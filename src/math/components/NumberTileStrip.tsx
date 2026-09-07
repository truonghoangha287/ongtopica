import { useTranslation } from 'react-i18next';
import { answerRole, answerVisualState } from '@/math/components/answer-state';
import { MONO } from '@/math/components/QuizOption';
import { NUMBER_TILE_MIN, NUMBER_TILE_MAX } from '@/math/constants/math-constants';

interface NumberTileStripProps {
  /** The value tapped so far, or null. */
  selected: number | null;
  checked: boolean;
  /** The number that answers the question. */
  answerValue: number;
  onSelect: (value: number) => void;
}

const COLUMNS = 6;
/** Minimum comfortable tap target for small hands (WCAG 2.5.5). */
const TILE_SIZE = 48;

/**
 * The 0–10 answer strip. Tapping a number is a real answer rather than a pick
 * from four near-misses, so a right answer means she knew it — and the strip
 * doubles as a number line she can count along. Each tile states its own
 * correctness in its label once graded, so colour is never the only signal
 * (Constitution II).
 */
export function NumberTileStrip({ selected, checked, answerValue, onSelect }: NumberTileStripProps) {
  const { t } = useTranslation('math');
  const values = Array.from(
    { length: NUMBER_TILE_MAX - NUMBER_TILE_MIN + 1 },
    (_, i) => NUMBER_TILE_MIN + i,
  );

  const labelFor = (value: number) => {
    if (!checked) return t('quiz.tileAria', { value });
    if (value === answerValue) return t('quiz.tileCorrectAria', { value });
    if (value === selected) return t('quiz.tileWrongAria', { value });
    return t('quiz.tileAria', { value });
  };

  return (
    <div
      role="group"
      aria-label={t('quiz.tileStripAria', { min: NUMBER_TILE_MIN, max: NUMBER_TILE_MAX })}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLUMNS}, ${TILE_SIZE}px)`,
        gap: 8,
        justifyContent: 'center',
        maxWidth: 360,
        margin: '0 auto 18px',
      }}
    >
      {values.map((value) => {
        const { bg, fg, shadow, opacity } = answerVisualState(
          answerRole(value === answerValue, value === selected),
          value === selected,
          checked,
        );
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={checked}
            aria-label={labelFor(value)}
            aria-pressed={value === selected}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: 14,
              fontFamily: MONO,
              fontSize: '1.25rem',
              fontWeight: 800,
              background: bg,
              color: fg,
              boxShadow: shadow,
              opacity,
            }}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}
