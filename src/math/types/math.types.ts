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

/** Bee Olympiad competition tracks (TIMO stays locked until `TIMO_UNLOCK_STARS`). */
export type OlympiadTrack = 'kangaroo' | 'sasmo';

/**
 * One quiz question — either a "what comes next" sequence or an expression.
 *
 * Questions are GENERATED into `src/math/data/banks/*.json` by
 * `scripts/generate-math-data.ts`; do not hand-edit the banks. Prompts/hints are
 * template i18n keys (`quiz.<topic>.tpl.<name>.{prompt,hint}`) shared across many
 * questions, so the numbers/symbols live in the language-neutral fields below.
 */
export interface QuizQuestion {
  /** Stable, generated id (e.g. `addsub-b3-2`). */
  id: string;
  /** Difficulty band 1–12, mapped 1:1 onto the topic's journey levels. */
  band: number;
  type: 'seq' | 'expr';
  /** i18n key under `quiz.<topic>.tpl.<name>.prompt`. */
  promptKey: string;
  /** i18n key under `quiz.<topic>.tpl.<name>.hint` ('' renders no hint). */
  hintKey: string;
  /** Sequence tiles (type === 'seq'); the missing tile renders as "?". */
  seq?: string[];
  /** Expression string shown in the card (type === 'expr'; '' renders no card). */
  expr?: string;
  /** Answer labels; exactly one is correct. */
  options: string[];
  /** Index into `options` of the correct answer. */
  answer: number;
  /** Olympiad only: which competition track this puzzle belongs to. */
  track?: OlympiadTrack;
  /**
   * Which widget the child answers with. Absent means `'choice'`, which every
   * hive and Olympiad question uses.
   */
  input?: AnswerInput;
  /**
   * `input: 'tiles'` only — the number the child must tap. Invariant enforced by
   * the bank test: `options === [String(answerValue)]` and `answer === 0`, so
   * `options[answer]` still reveals the correct label everywhere.
   */
  answerValue?: number;
  /** Ten-frame scaffold: how many of `TEN_FRAME_CELLS` to draw filled. */
  tenFrame?: number;
  /** Interpolation values for `promptKey`/`hintKey` (e.g. the fact a pair refers back to). */
  vars?: Record<string, string | number>;
}

/**
 * How a child enters an answer. `'choice'` is the 2×2 option grid, `'tiles'` the
 * 0–10 number strip, `'symbols'` the fixed `< > =` row.
 */
export type AnswerInput = 'choice' | 'tiles' | 'symbols';

/** The Number Lab practice stages, in teaching order. */
export type PracticeStageId = 'sums' | 'bonds' | 'addend' | 'takeaway' | 'factfam' | 'compare';

/** One stage of the Number Lab ladder. */
export interface PracticeStage {
  id: PracticeStageId;
  /** 1-based position; also the question `band` in the generated bank. */
  index: number;
  /** Emoji shown on the stage card (always paired with a text label). */
  icon: string;
  /** i18n key under `lab.stages.*` for the human-readable name. */
  nameKey: string;
  /**
   * A worked example of the stage's question form, shown under its name on the
   * picker card. Digits and operators only, so it needs no translation.
   */
  example: string;
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
