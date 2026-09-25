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

/**
 * Rotating question windows per stage. Each run serves the next window, so a
 * child works through all `PRACTICE_WINDOWS * PRACTICE_STAGE_SIZE` of a stage's
 * questions before any of them comes round again.
 */
export const PRACTICE_WINDOWS = 15;

/** Seconds per question when the optional "quick react" countdown is on. */
export const QUICK_REACT_SECONDS = 10;

/** Seconds remaining at which the countdown starts warning. */
export const QUICK_REACT_WARN_SECONDS = 3;

/** Namespace for Number Lab rows in the shared `mathTopicProgress` table. */
export const PRACTICE_TOPIC_PREFIX = 'numberlab';

// ---------------------------------------------------------------------------
// Find X — the guided "how do I find the unknown" stages (7–9).
// ---------------------------------------------------------------------------

/**
 * Ceiling for every value in a Find X problem, including intermediates. The
 * number-tile strip is the answer widget and 21 tiles is its comfortable limit;
 * past that the activity needs a keypad, which is a different design.
 */
export const FINDX_VALUE_MAX = 20;

/**
 * How many times the composer may discard a candidate problem that violates the
 * range or the `x ∉ {0, a, b}` rule before falling back to a known-good one.
 * Exists so a starved form can never spin the generator forever.
 */
export const FINDX_MAX_REDRAWS = 8;

/** Share of a run dressed as a word problem rather than a bare equation. */
export const FINDX_STORY_RATIO = 1 / 3;

/**
 * Stage index of the first Find X card. Continues the Number Lab's numbering
 * (1–6 are the bank-backed stages) without joining `PRACTICE_STAGES`, whose
 * length is asserted against the generated bank.
 */
export const FINDX_FIRST_STAGE_INDEX = 7;

/**
 * Problems per run, per stage. A guided problem costs up to six taps against a
 * classic lab question's one, so the guided run is shortest — all three land
 * around three minutes.
 */
export const FINDX_RUN_SIZES = { guided: 6, short: 8, solo: 10 } as const;
