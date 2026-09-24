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
  /** `'large'` is the Number Lab's full-width strip; `'compact'` the hive's. */
  size?: TileSize;
  /**
   * Top of the strip. Defaults to the Number Lab's ceiling; Find X raises it to
   * `FINDX_VALUE_MAX` because its problems run past ten.
   */
  max?: number;
  /**
   * Values already tried and rejected on this question. They stay on screen,
   * disabled, so a child can see what she has ruled out.
   */
  disabledValues?: number[];
  /**
   * Override the i18n keys used for the tap/wrong/strip aria-labels. Every
   * Vietnamese Find X screen carries `lang="vi"`, so its tile strip must not
   * announce the Number Lab's English "Tap {{value}}" inside that subtree.
   * Each entry defaults to the Number Lab's own key, so leaving this unset
   * reproduces today's behaviour exactly.
   */
  ariaKeys?: { tile?: string; wrong?: string; strip?: string };
}

/** How much room the strip is given — the hive packs it under a question card. */
export type TileSize = 'compact' | 'large';

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
export function NumberTileStrip({
  selected, checked, answerValue, onSelect, size = 'compact',
  max = NUMBER_TILE_MAX, disabledValues = [], ariaKeys,
}: NumberTileStripProps) {
  const { t } = useTranslation('math');
  const large = size === 'large';
  const tileKey = ariaKeys?.tile ?? 'quiz.tileAria';
  const wrongKey = ariaKeys?.wrong ?? 'quiz.tileWrongAria';
  const stripKey = ariaKeys?.strip ?? 'quiz.tileStripAria';
  const values = Array.from(
    { length: max - NUMBER_TILE_MIN + 1 },
    (_, i) => NUMBER_TILE_MIN + i,
  );

  const labelFor = (value: number) => {
    if (!checked) return t(tileKey, { value });
    if (value === answerValue) return t('quiz.tileCorrectAria', { value });
    if (value === selected) return t(wrongKey, { value });
    return t(tileKey, { value });
  };

  return (
    <div
      role="group"
      aria-label={t(stripKey, { min: NUMBER_TILE_MIN, max })}
      style={{
        display: 'grid',
        gridTemplateColumns: large
          ? `repeat(${COLUMNS}, minmax(0, 1fr))`
          : `repeat(${COLUMNS}, ${TILE_SIZE}px)`,
        gap: large ? 10 : 8,
        justifyContent: 'center',
        maxWidth: large ? undefined : 360,
        margin: large ? '0 0 22px' : '0 auto 18px',
      }}
    >
      {values.map((value) => {
        const rejected = disabledValues.includes(value);
        // A rejected tile always gets the "chosen wrong" treatment, even
        // though the strip itself is never `checked` on Find X's compute
        // step. `disabledValues` is empty everywhere except Find X, so the
        // Number Lab's own tiles are untouched by this branch.
        const role = rejected ? 'chosenWrong' : answerRole(value === answerValue, value === selected);
        const { bg, fg, shadow, opacity } = answerVisualState(role, value === selected, checked || rejected);
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            disabled={checked || rejected}
            aria-label={rejected ? t(wrongKey, { value }) : labelFor(value)}
            aria-pressed={value === selected}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: large ? undefined : TILE_SIZE,
              height: large ? 64 : TILE_SIZE,
              borderRadius: large ? 20 : 14,
              fontFamily: MONO,
              fontSize: large ? '1.6rem' : '1.25rem',
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
