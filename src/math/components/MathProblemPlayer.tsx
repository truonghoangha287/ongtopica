import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { SpeakButton } from '@/shared/components/SpeakButton';
import { PromptDisplay } from '@/math/components/PromptDisplay';
import { ChoiceButton } from '@/math/components/ChoiceButton';
import { SHAPE_LABELS } from '@/data/math-starters/shapes-catalog';
import { speak } from '@/shared/utils/speech';
import { playPop, playWin, playBuzz } from '@/shared/utils/sfx';
import { MAX_RETRIES } from '@/shared/constants/game-constants';
import type { ChoiceSpec, MathProblemPlayerProps } from '@/math/types/math.types';

/** Accessible name for a choice tile (numeral, count, emoji name, or shape name). */
function choiceLabel(choice: ChoiceSpec, index: number, optionWord: string): string {
  if (choice.shape) return SHAPE_LABELS[choice.shape];
  if (choice.count != null) return String(choice.count);
  if (choice.emoji) return choice.emoji; // screen readers announce the emoji's name
  if (choice.label) return choice.label;
  return `${optionWord} ${index + 1}`;
}

/**
 * The single activity component shared by all five math question types. Owns the
 * child-first feedback contract (Constitution I): narrate on load, tap to answer,
 * correct → celebrate + advance; wrong → gentle retry once, then reveal the answer
 * — never a punishment, never a red X.
 */
export function MathProblemPlayer({ problem, callbacks }: MathProblemPlayerProps) {
  const { t } = useTranslation('math');
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [retries, setRetries] = useState(0);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Narrate the question once when it appears (offline-safe, silent if muted).
  useEffect(() => {
    speak(problem.narration);
  }, [problem.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (choice: ChoiceSpec) => {
    if (done) return;
    if (choice.id === problem.answerId) {
      setMascotReaction('celebrate');
      setCelebrating(true);
      setDone(true);
      playWin();
      callbacks.onCorrect();
    } else if (retries < MAX_RETRIES) {
      setRetries((r) => r + 1);
      setMascotReaction('encourage');
      playBuzz();
      callbacks.onIncorrect();
      setTimeout(() => setMascotReaction('idle'), 800);
    } else {
      setRevealedId(problem.answerId);
      setDone(true);
      playPop();
      callbacks.onReveal();
    }
  };

  const optionWord = t('choice.option');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '64px 24px 32px',
      }}
    >
      <CelebrationEffect active={celebrating} />
      {/* Caption = the spoken question, always on screen (Constitution II — no audio-only). */}
      <p style={{ fontSize: '1.05rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0, textAlign: 'center' }}>
        {problem.narration}
      </p>
      <PromptDisplay prompt={problem.prompt} />
      <SpeakButton text={problem.narration} label={t('choice.hearAgain')} />
      <Mascot reaction={mascotReaction} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          width: '100%',
          maxWidth: 480,
        }}
      >
        {problem.choices.map((choice, i) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            onTap={() => handleTap(choice)}
            disabled={done}
            revealed={revealedId === choice.id}
            ariaLabel={choiceLabel(choice, i, optionWord)}
          />
        ))}
      </div>
      {done && (
        <button
          className="btn-accent"
          onClick={callbacks.onAdvance}
          style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          <span>{t('session.nextButton')}</span> <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
