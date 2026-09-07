import { create } from 'zustand';
import type { QuizQuestion } from '@/math/types/math.types';
import { isCorrect, nextHearts, shouldRequeue, STARTING_HEARTS } from '@/math/services/quiz-scorer';

/** How a run is played. Defaults reproduce the classic hive rules exactly. */
export interface QuizRunOptions {
  /** Hearts to start with. 0 disables hearts entirely (no game over). */
  hearts?: number;
  /** Re-ask a first-pass miss once, appended to the end of the queue. */
  requeueMisses?: boolean;
}

/**
 * Transient state for a single quiz run (mirrors the English `session-store`
 * pattern). Persistent results are written separately via `useMathProgress` /
 * `usePracticeProgress` when the run completes.
 */
interface MathQuizState {
  /**
   * The working queue: the first-pass questions, plus any requeued misses
   * appended to the end. Grows during a run when `requeueMisses` is on.
   */
  questions: QuizQuestion[];
  /** First-pass length — the denominator for stars, accuracy and the progress bar. */
  originalTotal: number;
  qIndex: number;
  /**
   * The child's answer. For `input: 'tiles'` questions this is the tapped
   * VALUE; for every other question it is an index into `options`.
   */
  selected: number | null;
  checked: boolean;
  /** True when the last grade came from the countdown expiring, not a tap. */
  timedOut: boolean;
  /** False in practice modes, where a wrong answer must never end the run. */
  heartsEnabled: boolean;
  hearts: number;
  requeueMisses: boolean;
  /** Correct on the first pass. */
  correctCount: number;
  /** Correct on the second look, after being requeued. */
  recoveredCount: number;
  /** Ids already requeued once, so nothing can loop forever. */
  requeuedIds: string[];
  startQuiz: (questions: QuizQuestion[], opts?: QuizRunOptions) => void;
  select: (value: number) => void;
  check: () => void;
  timeout: () => void;
  advance: () => void;
  reset: () => void;
}

const EMPTY = {
  questions: [] as QuizQuestion[],
  originalTotal: 0,
  qIndex: 0,
  selected: null,
  checked: false,
  timedOut: false,
  heartsEnabled: true,
  hearts: STARTING_HEARTS,
  requeueMisses: false,
  correctCount: 0,
  recoveredCount: 0,
  requeuedIds: [] as string[],
};

/**
 * Record a graded answer. `expired` marks a countdown timeout, which reveals
 * the answer and requeues it but never costs a heart.
 */
function grade(s: MathQuizState, correct: boolean, expired: boolean): Partial<MathQuizState> {
  const q = s.questions[s.qIndex];
  const firstPass = s.qIndex < s.originalTotal;
  const requeue = !correct && shouldRequeue(q, s.requeuedIds, firstPass, s.requeueMisses);
  return {
    checked: true,
    timedOut: expired,
    correctCount: s.correctCount + (correct && firstPass ? 1 : 0),
    recoveredCount: s.recoveredCount + (correct && !firstPass ? 1 : 0),
    questions: requeue ? [...s.questions, q] : s.questions,
    requeuedIds: requeue ? [...s.requeuedIds, q.id] : s.requeuedIds,
    hearts: s.heartsEnabled && !expired ? nextHearts(s.hearts, correct) : s.hearts,
  };
}

export const useMathQuizStore = create<MathQuizState>((set) => ({
  ...EMPTY,

  startQuiz: (questions, opts) => {
    const hearts = opts?.hearts ?? STARTING_HEARTS;
    set({
      ...EMPTY,
      questions,
      originalTotal: questions.length,
      heartsEnabled: hearts > 0,
      hearts,
      requeueMisses: opts?.requeueMisses ?? false,
    });
  },

  // Lock the choice once checked so a child can't change a graded answer.
  select: (value) => set((s) => (s.checked ? s : { selected: value })),

  check: () =>
    set((s) => {
      if (s.selected === null || s.checked) return s;
      return grade(s, isCorrect(s.selected, s.questions[s.qIndex]), false);
    }),

  timeout: () => set((s) => (s.checked || !s.questions[s.qIndex] ? s : grade(s, false, true))),

  advance: () => set((s) => ({ qIndex: s.qIndex + 1, selected: null, checked: false, timedOut: false })),

  reset: () => set({ ...EMPTY }),
}));
