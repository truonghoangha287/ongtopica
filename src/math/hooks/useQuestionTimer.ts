import { useEffect, useState } from 'react';

interface QuestionTimerOptions {
  /** Seconds allowed per question, or undefined to disable the countdown. */
  seconds?: number;
  /** Changes when a new question is shown; restarts the countdown. */
  questionKey: string | number;
  /** True while feedback is on screen — the clock holds rather than runs out twice. */
  paused: boolean;
  onExpire: () => void;
}

const TICK_MS = 1000;

/**
 * A one-tick-per-second countdown for the optional "quick react" mode.
 *
 * Deliberately state-driven rather than a CSS animation: it stays accurate when
 * the tab is backgrounded, and there is no motion to suppress for
 * `prefers-reduced-motion` beyond flattening the bar in CSS.
 */
export function useQuestionTimer({ seconds, questionKey, paused, onExpire }: QuestionTimerOptions) {
  const enabled = typeof seconds === 'number' && seconds > 0;
  const [secondsLeft, setSecondsLeft] = useState(seconds ?? 0);

  // A new question gets a full clock again.
  useEffect(() => {
    setSecondsLeft(seconds ?? 0);
  }, [questionKey, seconds]);

  useEffect(() => {
    if (!enabled || paused) return;
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), TICK_MS);
    return () => clearTimeout(id);
    // `onExpire` is intentionally excluded: it is re-created every render and
    // would restart the clock on each tick.
  }, [enabled, paused, secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  return { enabled, secondsLeft };
}
