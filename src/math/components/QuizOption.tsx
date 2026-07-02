import { useTranslation } from 'react-i18next';

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
 * A single answer tile. Colour states mirror the design: neutral, selected,
 * then after checking → green (correct) / red (chosen-wrong) / dimmed (others).
 * Correctness is conveyed by both colour and an aria-label, never colour alone
 * (Constitution II).
 */
export function QuizOption({ label, index, selected, checked, answerIndex, onSelect }: QuizOptionProps) {
  const { t } = useTranslation('math');

  let bg = '#fff';
  let fg = 'var(--ink)';
  let shadow = '0 6px 18px -12px rgba(80,60,30,.4)';
  let opacity = 1;
  if (checked) {
    if (index === answerIndex) {
      bg = 'oklch(93% 0.09 150)'; fg = 'oklch(38% 0.12 150)'; shadow = 'inset 0 0 0 3px var(--success)';
    } else if (index === selected) {
      bg = 'oklch(94% 0.07 25)'; fg = 'var(--danger, oklch(60% 0.19 25))'; shadow = 'inset 0 0 0 3px oklch(60% 0.19 25)';
    } else {
      opacity = 0.5;
    }
  } else if (index === selected) {
    bg = 'var(--ma-soft)'; fg = 'var(--ma-ink)'; shadow = 'inset 0 0 0 3px var(--ma)';
  }

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
