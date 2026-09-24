import type { PracticeStage, PracticeStageId, QuizQuestion } from '@/math/types/math.types';
import type { FindXLevel } from '@/math/types/find-x.types';
import { FINDX_FIRST_STAGE_INDEX, PRACTICE_STAGE_SIZE } from '@/math/constants/math-constants';
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
  { id: 'sums', index: 1, icon: '🐝', nameKey: 'lab.stages.sums', example: '3 + 4 = ?' },
  { id: 'bonds', index: 2, icon: '🍯', nameKey: 'lab.stages.bonds', example: '6 + ? = 10' },
  { id: 'addend', index: 3, icon: '➕', nameKey: 'lab.stages.addend', example: '5 + ? = 9' },
  { id: 'takeaway', index: 4, icon: '➖', nameKey: 'lab.stages.takeaway', example: '? − 8 = 2' },
  { id: 'factfam', index: 5, icon: '🔁', nameKey: 'lab.stages.factfam', example: '3 + 5 = 8, so 8 − 5 = ?' },
  { id: 'compare', index: 6, icon: '⚖️', nameKey: 'lab.stages.compare', example: '7 + 2 ? 10' },
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

/**
 * The Find X stages, in fading order: every decision asked, then only the ones
 * that trip children up, then the bare question with a hint on demand.
 *
 * Deliberately NOT appended to `PRACTICE_STAGES`. That array is the bank-backed
 * ladder and `PRACTICE_STAGE_COUNT` is its band range —
 * `math-number-lab-data.test.ts` asserts the bank holds exactly
 * `count × size × windows` questions and that every stage in it has some. Find X
 * has no bank, so joining that array would break a true test with a false stage.
 */
export const FINDX_STAGES: PracticeStage[] = [
  { id: 'findxGuided', index: FINDX_FIRST_STAGE_INDEX, icon: '🧭', nameKey: 'lab.stages.findxGuided', example: 'x + 6 = 14', activity: 'findx' },
  { id: 'findxShort', index: FINDX_FIRST_STAGE_INDEX + 1, icon: '🧮', nameKey: 'lab.stages.findxShort', example: 'x − 8 = 5', activity: 'findx' },
  { id: 'findxSolo', index: FINDX_FIRST_STAGE_INDEX + 2, icon: '🎯', nameKey: 'lab.stages.findxSolo', example: '20 − x = 12', activity: 'findx' },
];

/** Every card the Number Lab pillar shows, bank-backed stages first. */
export const LAB_STAGES: PracticeStage[] = [...PRACTICE_STAGES, ...FINDX_STAGES];

const FINDX_BY_ID = new Map(FINDX_STAGES.map((s) => [s.id as string, s]));

export function getFindXStageById(id: string): PracticeStage | undefined {
  return FINDX_BY_ID.get(id);
}

const LEVEL_BY_ID: Record<string, FindXLevel> = {
  findxGuided: 'guided',
  findxShort: 'short',
  findxSolo: 'solo',
};

export function findXLevelOf(id: string): FindXLevel | undefined {
  return LEVEL_BY_ID[id];
}
