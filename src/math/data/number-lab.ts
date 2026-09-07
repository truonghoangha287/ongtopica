import type { PracticeStage, PracticeStageId, QuizQuestion } from '@/math/types/math.types';
import { PRACTICE_STAGE_SIZE } from '@/math/constants/math-constants';
import { windowForAttempt } from '@/math/services/practice-progress';

// Generated bank — see `scripts/generate-number-lab-data.ts`. Do not hand-edit.
import numberlab from './banks/numberlab.json';

/**
 * The Number Lab ladder, in teaching order. Each stage's position is also its
 * question `band` in the bank. The order is deliberate: facts she owns, then
 * bonds to 10, then the unknown moved into an addition, then into a
 * subtraction — the form that actually trips children up — then fact families
 * to tie addition and subtraction together, then comparison.
 *
 * Deliberately NOT part of `MATH_QUIZZES`: these are tile/symbol questions with
 * six stages, not the hive's twelve bands of four-option questions, and mixing
 * the two would weaken the guarantees the hive bank test enforces.
 */
export const PRACTICE_STAGES: PracticeStage[] = [
  { id: 'sums', index: 1, icon: '🐝', nameKey: 'lab.stages.sums' },
  { id: 'bonds', index: 2, icon: '🍯', nameKey: 'lab.stages.bonds' },
  { id: 'addend', index: 3, icon: '➕', nameKey: 'lab.stages.addend' },
  { id: 'takeaway', index: 4, icon: '➖', nameKey: 'lab.stages.takeaway' },
  { id: 'factfam', index: 5, icon: '🔁', nameKey: 'lab.stages.factfam' },
  { id: 'compare', index: 6, icon: '⚖️', nameKey: 'lab.stages.compare' },
];

const BANK = numberlab as unknown as QuizQuestion[];
const STAGE_BY_ID = new Map(PRACTICE_STAGES.map((s) => [s.id, s]));

export function getPracticeStageById(id: string): PracticeStage | undefined {
  return STAGE_BY_ID.get(id as PracticeStageId);
}

/**
 * One attempt's worth of questions for a stage: a rotating window of the
 * stage's bank, so replaying is fresh practice rather than the same ten
 * questions memorised in order. Falls back to the first window if the stage or
 * attempt is out of range, so a child never hits an empty run.
 */
export function getPracticeQuiz(stageIndex: number, attempt = 1): QuizQuestion[] {
  const stageQuestions = BANK.filter((q) => q.band === stageIndex);
  if (stageQuestions.length === 0) return [];
  const start = windowForAttempt(attempt) * PRACTICE_STAGE_SIZE;
  const slice = stageQuestions.slice(start, start + PRACTICE_STAGE_SIZE);
  return slice.length > 0 ? slice : stageQuestions.slice(0, PRACTICE_STAGE_SIZE);
}
