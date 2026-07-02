/**
 * Domain types for the Math World subject ("Ong the bee" experience).
 * Kept free of React/Dexie imports so the pure services and data modules can
 * depend on them without pulling in UI or storage concerns.
 */

/** Stable identifiers for the eight honeycomb cells in the Skills Hive. */
export type MathTopicId =
  | 'counting'
  | 'multiply'
  | 'shapes'
  | 'addsub'
  | 'fractions'
  | 'timemoney'
  | 'patterns'
  | 'logic';

/** A single honeycomb cell / journey subject in the Skills Hive. */
export interface MathTopic {
  id: MathTopicId;
  /** Emoji shown in the hex and journey header (has a text label alongside it). */
  icon: string;
  /** i18n key under `topics.*` for the human-readable name. */
  nameKey: string;
  /** Hue (oklch) used to tint the hexagon background. */
  hue: number;
  /** Absolute position of the hex inside the 354×327 honeycomb frame. */
  left: number;
  top: number;
  /** When true the cell is a locked teaser (Logic) until `unlockStars` is reached. */
  locked?: boolean;
  /** Total-star threshold required to unlock a `locked` topic. */
  unlockStars?: number;
  /** When true the cell feeds the Bee Olympiad pillar. */
  olympiad?: boolean;
}

/** One quiz question — either a "what comes next" sequence or an expression. */
export interface QuizQuestion {
  type: 'seq' | 'expr';
  /** i18n key under `quiz.<topic>.<n>.prompt`. */
  promptKey: string;
  /** i18n key under `quiz.<topic>.<n>.hint` ('' renders no hint). */
  hintKey: string;
  /** Sequence tiles (type === 'seq'); the missing tile renders as "?". */
  seq?: string[];
  /** Expression string shown in the card (type === 'expr'). */
  expr?: string;
  /** Answer labels; exactly one is correct. */
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
}

/** Star rating awarded for a completed hive (1–3). */
export type StarRating = 1 | 2 | 3;

/** Per-topic mastery persisted per child. */
export interface TopicProgress {
  /** Best star rating earned on this topic so far (0 = never cleared). */
  stars: 0 | StarRating;
  /** Highest journey level reached (1-based). */
  level: number;
}
