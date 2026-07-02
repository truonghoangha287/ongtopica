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

/** Levels in a topic journey (design shows "Level 4 of 12"). */
export const TOPIC_LEVEL_COUNT = 12;

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
