import type { RuleId } from './data/rules';
import type { Rng } from './services/rng';

export type GrammarGameId = 'plurals' | 'verbs' | 'bd';

/** One question. The engine renders this without knowing which game made it. */
export interface DrillItem {
  rule: RuleId;
  picture: {
    asset: string;
    /** Screen-reader description; also the real word in the b/d game. */
    alt: string;
    /** How many times to repeat the picture — 3 apples means "apples". */
    repeat: number;
  };
  /** Gapped sentence, e.g. "the teacher ___ English." Absent in picture-only games. */
  sentence?: string;
  options: string[];
  answer: string;
  /** Optional on-screen help the engine knows how to render. */
  hint?: 'bed-anchor';
}

export interface GrammarGame {
  id: GrammarGameId;
  /** Rules this game can build items for. */
  rules: RuleId[];
  /** Returns null when no item can be built — the caller should try another rule. */
  buildItem: (rule: RuleId, rng: Rng) => DrillItem | null;
}
