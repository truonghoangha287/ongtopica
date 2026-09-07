import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LETTER_KEYPAD_COLUMNS } from '@/shared/constants/game-constants';
import { KEYPAD_LETTERS } from '@/english/vocab/services/type-word';

/** Minimum comfortable tap target for small hands (WCAG 2.5.5). */
const KEY_SIZE = 44;
const GAP = 6;

interface LetterKeypadProps {
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
  /** Key that just took a wrong tap, shaken once as feedback. */
  shakingLetter?: string | null;
}

/**
 * The on-screen A-Z keypad.
 *
 * The app is tap-only on a tablet, so a real keyboard cannot be assumed -- and
 * raising the OS keyboard would cover the picture the child is spelling from.
 * `TypeWordPage` also listens for physical keys and routes them through the
 * same callbacks, so both inputs share one code path.
 */
export function LetterKeypad({
  onLetter,
  onBackspace,
  disabled = false,
  shakingLetter = null,
}: LetterKeypadProps) {
  const { t } = useTranslation('vocab');

  return (
    <div
      role="group"
      aria-label={t('activities.typeWord.keypadAria', 'Letter keys')}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${LETTER_KEYPAD_COLUMNS}, ${KEY_SIZE}px)`,
        gap: GAP,
        justifyContent: 'center',
        maxWidth: LETTER_KEYPAD_COLUMNS * (KEY_SIZE + GAP),
        margin: '0 auto',
      }}
    >
      {KEYPAD_LETTERS.map((letter) => (
        <motion.button
          key={letter}
          onClick={() => onLetter(letter)}
          disabled={disabled}
          aria-label={t('activities.typeWord.keyAria', 'letter {{letter}}', { letter })}
          animate={shakingLetter === letter ? { x: [0, -5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: KEY_SIZE,
            height: KEY_SIZE,
            borderRadius: 10,
            fontSize: '1.15rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            background: 'var(--paper)',
            color: 'var(--ink)',
            boxShadow: 'var(--shadow-card)',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'default' : 'pointer',
          }}
        >
          {letter}
        </motion.button>
      ))}
      <button
        onClick={onBackspace}
        disabled={disabled}
        aria-label={t('activities.typeWord.backspaceAria', 'delete the last letter')}
        style={{
          // Spans the row's remaining columns so the row reads as complete.
          gridColumn: `span ${LETTER_KEYPAD_COLUMNS - (KEYPAD_LETTERS.length % LETTER_KEYPAD_COLUMNS)}`,
          height: KEY_SIZE,
          borderRadius: 10,
          fontSize: '1.15rem',
          background: 'var(--muted)',
          color: 'var(--muted-fg)',
          fontWeight: 800,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        ⌫
      </button>
    </div>
  );
}
