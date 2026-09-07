import { useTranslation } from 'react-i18next';
import { answerRole, answerVisualState } from '@/math/components/answer-state';

interface QuizOptionProps {
  label: string;
  index: number;
  selected: number | null;
  checked: boolean;
  answerIndex: number;
  onSelect: (index: number) => void;
}

const MONO = "'JetBrains Mono', ui-monospace, monospace";

/**
 * A single answer tile. Colour states come from the shared `answer-state`
 * helper: neutral, selected, then after checking → green (correct) / red
 * (chosen-wrong) / dimmed (others). Correctness is conveyed by both colour and
 * an aria-label, never colour alone (Constitution II).
 */
export function QuizOption({ label, index, selected, checked, answerIndex, onSelect }: QuizOptionProps) {
  const { t } = useTranslation('math');
  const { bg, fg, shadow, opacity } = answerVisualState(
    answerRole(index === answerIndex, index === selected),
    index === selected,
    checked,
  );

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={checked}
      aria-label={t('quiz.optionAria', { label })}
      aria-pressed={index === selected}
      style={{
        display: 'grid',
        placeItems: 'center',
        height: 72,
        borderRadius: 18,
        fontFamily: MONO,
        fontSize: '1.5rem',
        fontWeight: 800,
        background: bg,
        color: fg,
        boxShadow: shadow,
        opacity,
      }}
    >
      {label}
    </button>
  );
}

export { MONO };
