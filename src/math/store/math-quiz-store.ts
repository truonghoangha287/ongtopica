import { create } from 'zustand';
import type { MathTopicId, QuizQuestion } from '@/math/types/math.types';
import { isCorrect, nextHearts, STARTING_HEARTS } from '@/math/services/quiz-scorer';

/**
 * Transient state for a single hive quiz run (mirrors the English
 * `session-store` pattern). Persistent results are written separately via
 * `useMathProgress` when the run completes.
 */
interface MathQuizState {
  topicId: MathTopicId | null;
  isOlympiad: boolean;
  questions: QuizQuestion[];
  qIndex: number;
  selected: number | null;
  checked: boolean;
  hearts: number;
  correctCount: number;
  startQuiz: (topicId: MathTopicId, questions: QuizQuestion[], isOlympiad: boolean) => void;
  select: (index: number) => void;
  check: () => void;
  advance: () => void;
  reset: () => void;
}

export const useMathQuizStore = create<MathQuizState>((set) => ({
  topicId: null,
  isOlympiad: false,
  questions: [],
  qIndex: 0,
  selected: null,
  checked: false,
  hearts: STARTING_HEARTS,
  correctCount: 0,

  startQuiz: (topicId, questions, isOlympiad) =>
    set({
      topicId,
      isOlympiad,
      questions,
      qIndex: 0,
      selected: null,
      checked: false,
      hearts: STARTING_HEARTS,
      correctCount: 0,
    }),

  // Lock the choice once checked so a child can't change a graded answer.
  select: (index) => set((s) => (s.checked ? s : { selected: index })),

  check: () =>
    set((s) => {
      if (s.selected === null || s.checked) return s;
      const correct = isCorrect(s.selected, s.questions[s.qIndex]);
      return {
        checked: true,
        correctCount: s.correctCount + (correct ? 1 : 0),
        hearts: nextHearts(s.hearts, correct),
      };
    }),

  advance: () => set((s) => ({ qIndex: s.qIndex + 1, selected: null, checked: false })),

  reset: () =>
    set({
      topicId: null,
      isOlympiad: false,
      questions: [],
      qIndex: 0,
      selected: null,
      checked: false,
      hearts: STARTING_HEARTS,
      correctCount: 0,
    }),
}));
