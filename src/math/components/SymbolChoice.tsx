import { useTranslation } from 'react-i18next';
import { answerRole, answerVisualState } from '@/math/components/answer-state';
import { MONO } from '@/math/components/QuizOption';

interface SymbolChoiceProps {
  /** The comparison glyphs, always in `SYMBOL_ORDER`. */
  options: string[];
  selected: number | null;
  checked: boolean;
  answerIndex: number;
  onSelect: (index: number) => void;
}

/** Fixed presentation order, so the buttons never move between questions. */
export const SYMBOL_ORDER = ['<', '>', '='] as const;

/** i18n key for each glyph's spoken name, e.g. "is less than". */
const NAME_KEY: Record<string, string> = {
  '<': 'quiz.symbol.less',
  '>': 'quiz.symbol.greater',
  '=': 'quiz.symbol.equal',
};

/**
 * The i18n key naming a comparison glyph as a NOUN phrase ("less than"), for
 * revealing an answer inside a sentence. The button's own name is a verb phrase
 * ("is less than"), which reads well on a control but not after "it's".
 */
export function symbolRevealKey(glyph: string): string | undefined {
  const suffix = NAME_KEY[glyph];
  return suffix && suffix.replace('quiz.symbol.', 'quiz.symbolName.');
}

/**
 * The `< > =` answer row for comparison questions. Order is fixed rather than
 * shuffled so the child builds muscle memory for where each symbol lives, and
 * every button carries a spoken name because the glyphs alone are meaningless
 * to a screen reader.
 */
export function SymbolChoice({ options, selected, checked, answerIndex, onSelect }: SymbolChoiceProps) {
  const { t } = useTranslation('math');

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '0 auto 18px' }}>
      {options.map((glyph, i) => {
        const { bg, fg, shadow, opacity } = answerVisualState(
          answerRole(i === answerIndex, i === selected),
          i === selected,
          checked,
        );
        return (
          <button
            key={glyph}
            onClick={() => onSelect(i)}
            disabled={checked}
            aria-label={t(NAME_KEY[glyph] ?? 'quiz.optionAria', { label: glyph })}
            aria-pressed={i === selected}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 82,
              height: 68,
              borderRadius: 18,
              fontFamily: MONO,
              fontSize: '1.9rem',
              fontWeight: 800,
              background: bg,
              color: fg,
              boxShadow: shadow,
              opacity,
            }}
          >
            {glyph}
          </button>
        );
      })}
    </div>
  );
}
