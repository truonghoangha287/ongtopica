/**
 * Named game parameters for Math World. Per Constitution VI, no magic numbers
 * appear in components or services — every tunable lives here with a comment.
 */

/** Hearts (lives) a child starts each hive quiz with; a wrong answer costs one. */
export const STARTING_HEARTS = 3;

/** Honey 🍯 awarded for completing a hive quiz. */
export const HONEY_PER_HIVE = 40;

/** Hives that make up a full "today's goal" ring on the hub. */
export const DAILY_GOAL_HIVES = 3;

/** Total stars required before the locked Logic hex opens. */
export const LOGIC_UNLOCK_STARS = 30;

/** Total stars required before the TIMO Olympiad track opens. */
export const TIMO_UNLOCK_STARS = 50;

/** Levels in a topic journey (design shows "Level 4 of 12"); also the band count. */
export const TOPIC_LEVEL_COUNT = 12;

/** Puzzles served per Bee Olympiad track in a daily challenge. */
export const OLYMPIAD_DAILY_COUNT = 5;

/**
 * Star-award thresholds, expressed as the fraction of a hive's questions a
 * child must answer correctly. `>= all` → 3★, `>= half` → 2★, else 1★.
 * The exact boundaries live in `quiz-scorer` which references these.
 */
export const TWO_STAR_FRACTION = 0.5;

/** Milliseconds in a day, used to derive whole-day indices for streaks. */
export const MS_PER_DAY = 86_400_000;

/** Layout of the honeycomb frame the hex cells are absolutely positioned in. */
export const HIVE_FRAME_WIDTH = 354;
export const HIVE_FRAME_HEIGHT = 327;
export const HEX_WIDTH = 118;
export const HEX_HEIGHT = 131;

// ---------------------------------------------------------------------------
// Number Lab — the ≤10 missing-number practice pillar.
// ---------------------------------------------------------------------------

/** Range of the number-tile answer strip. The whole Number Lab lives in 0..10. */
export const NUMBER_TILE_MIN = 0;
export const NUMBER_TILE_MAX = 10;

/** Cells in the ten-frame scaffold shown on the number-bond stage. */
export const TEN_FRAME_CELLS = 10;

/** Stages in the Number Lab ladder; also the question `band` range in its bank. */
export const PRACTICE_STAGE_COUNT = 6;

/** Questions per attempt — short enough to finish in one sitting (~2–3 min). */
export const PRACTICE_STAGE_SIZE = 10;

/** Rotating question windows per stage, so a replay is not the same 10 questions. */
export const PRACTICE_WINDOWS = 3;

/** Stars needed on a stage before the next one opens. */
export const PRACTICE_UNLOCK_STARS = 1;

/** Seconds per question when the optional "quick react" countdown is on. */
export const QUICK_REACT_SECONDS = 10;

/** Seconds remaining at which the countdown starts warning. */
export const QUICK_REACT_WARN_SECONDS = 3;

/** Namespace for Number Lab rows in the shared `mathTopicProgress` table. */
export const PRACTICE_TOPIC_PREFIX = 'numberlab';
