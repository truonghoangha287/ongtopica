import { QuizOption } from '@/math/components/QuizOption';
import { NumberTileStrip } from '@/math/components/NumberTileStrip';
import type { TileSize } from '@/math/components/NumberTileStrip';
import { SymbolChoice } from '@/math/components/SymbolChoice';
import type { QuizQuestion } from '@/math/types/math.types';

interface QuizAnswerPadProps {
  question: QuizQuestion;
  /** Tapped value for tile questions, option index otherwise. */
  selected: number | null;
  checked: boolean;
  onSelect: (value: number) => void;
  /** Passed straight through to the tile/symbol widgets. */
  size?: TileSize;
}

/**
 * Renders whichever answer widget a question calls for. Keeping the switch in
 * one place means `QuizRunner` never has to know how a question is answered.
 */
export function QuizAnswerPad({ question, selected, checked, onSelect, size }: QuizAnswerPadProps) {
  if (question.input === 'tiles') {
    return (
      <NumberTileStrip
        selected={selected}
        checked={checked}
        answerValue={question.answerValue ?? -1}
        onSelect={onSelect}
        size={size}
      />
    );
  }

  if (question.input === 'symbols') {
    return (
      <SymbolChoice
        options={question.options}
        selected={selected}
        checked={checked}
        answerIndex={question.answer}
        onSelect={onSelect}
        size={size}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 340, margin: '0 auto 18px' }}>
      {question.options.map((opt, i) => (
        <QuizOption
          key={i}
          label={opt}
          index={i}
          selected={selected}
          checked={checked}
          answerIndex={question.answer}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
