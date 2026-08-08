import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { playCorrect, playBuzz } from '@/shared/utils/sfx';

/**
 * Shared answer-feedback for every learning activity: a single bold, animated
 * toast plus sound plus a screen-reader announcement, so a right/wrong tap is
 * never silent. Each activity calls `signalCorrect()` / `signalWrong()` at the
 * moment of truth and renders `feedbackNode` once anywhere in its tree.
 */

type Kind = 'correct' | 'wrong';

interface Pulse {
  kind: Kind;
  id: number;
  label?: string;
}

interface SignalOptions {
  /** Override the default toast label ("Correct!" / "Try again!"). */
  label?: string;
  /** Skip the sound (for activities that already play their own cue). */
  silent?: boolean;
}

export interface AnswerFeedback {
  signalCorrect: (opts?: SignalOptions) => void;
  signalWrong: (opts?: SignalOptions) => void;
  feedbackNode: ReactNode;
}

const HOLD_MS: Record<Kind, number> = { correct: 1100, wrong: 950 };

export function useAnswerFeedback(): AnswerFeedback {
  const { t } = useTranslation('vocab');
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const seq = useRef(0);

  const fire = useCallback((kind: Kind, opts?: SignalOptions) => {
    if (!opts?.silent) (kind === 'correct' ? playCorrect : playBuzz)();
    seq.current += 1;
    setPulse({ kind, id: seq.current, label: opts?.label });
  }, []);

  const signalCorrect = useCallback((opts?: SignalOptions) => fire('correct', opts), [fire]);
  const signalWrong = useCallback((opts?: SignalOptions) => fire('wrong', opts), [fire]);

  const clear = useCallback(
    (id: number) => setPulse((p) => (p && p.id === id ? null : p)),
    []
  );

  const feedbackNode = (
    <FeedbackToast
      pulse={pulse}
      onDone={clear}
      correctLabel={t('activities.feedback.correct')}
      wrongLabel={t('activities.feedback.tryAgain')}
    />
  );

  return { signalCorrect, signalWrong, feedbackNode };
}

interface ToastProps {
  pulse: Pulse | null;
  onDone: (id: number) => void;
  correctLabel: string;
  wrongLabel: string;
}

function FeedbackToast({ pulse, onDone, correctLabel, wrongLabel }: ToastProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!pulse) return;
    const id = pulse.id;
    const timer = setTimeout(() => onDone(id), HOLD_MS[pulse.kind]);
    return () => clearTimeout(timer);
  }, [pulse, onDone]);

  const isCorrect = pulse?.kind === 'correct';
  const label = pulse?.label ?? (isCorrect ? correctLabel : wrongLabel);

  return (
    <div
      style={{
        position: 'fixed',
        top: '13%',
        left: 0,
        right: 0,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      <AnimatePresence>
        {pulse && (
          <motion.div
            key={pulse.id}
            role="status"
            aria-live="assertive"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: -10 }}
            animate={
              reduce
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: isCorrect ? 0 : [0, -9, 9, -7, 7, 0],
                  }
            }
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={
              reduce
                ? { duration: 0.15 }
                : {
                    default: { type: 'spring', stiffness: 520, damping: isCorrect ? 13 : 20 },
                    x: { type: 'tween', duration: 0.35, ease: 'easeInOut' },
                  }
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 24px 11px 13px',
              borderRadius: 9999,
              fontSize: '1.35rem',
              fontWeight: 900,
              color: '#fff',
              background: isCorrect ? 'var(--success)' : 'var(--destructive)',
              boxShadow: isCorrect ? 'var(--shadow-pop)' : 'var(--shadow-pop-accent)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 34,
                height: 34,
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.28)',
                fontSize: '1.2rem',
              }}
            >
              {isCorrect ? '✓' : '↺'}
            </span>
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
