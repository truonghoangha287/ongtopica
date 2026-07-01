import type { MathProgressRow } from '@/shared/db/schema';

/** The five Timo-inspired question formats, all rendered by MathProblemPlayer. */
export type MathActivityType =
  | 'tap-number' // recognise / add / subtract — tap the correct numeral
  | 'count-objects' // count a cluster — tap the count
  | 'pick-next' // pattern — tap what comes next
  | 'tap-shape' // tap the named shape
  | 'odd-one-out'; // logic — tap the item that does not belong

export type ShapeKind =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'star'
  | 'heart'
  | 'diamond'
  | 'oval';

/** What the question shows above the choices. */
export interface PromptSpec {
  kind: 'numeral' | 'dots' | 'word' | 'expression' | 'shape-name' | 'sequence' | 'instruction';
  value?: string | number; // numeral value / word text / expression text / shape name
  count?: number; // dots: how many dots
  emoji?: string; // object glyph for dots/objects
  sequence?: ChoiceSpec[]; // pick-next: items to display, ending with a "?" placeholder
  i18nKey?: string; // instruction prompts resolved from the math namespace
}

/** One tappable option. Exactly one per problem matches answerId. */
export interface ChoiceSpec {
  id: string;
  label?: string; // numeral / text
  emoji?: string; // object glyph
  shape?: ShapeKind; // render via ShapeGlyph
  count?: number; // a choice that is itself a cluster of N objects
}

export interface MathProblem {
  id: string; // e.g. "numbers.07", "addition.2plus3"
  topicId: string;
  type: MathActivityType;
  prompt: PromptSpec;
  choices: ChoiceSpec[]; // length === MATH_CHOICE_COUNT
  answerId: string; // must equal one choice.id
  narration: string; // spoken aloud + shown as caption
}

export interface MathTopic {
  id: string; // 'numbers' | 'counting' | ... | 'logic'
  problems: MathProblem[];
}

export interface MathActivityCallbacks {
  onCorrect: () => void;
  onIncorrect: () => void;
  onReveal: () => void;
  onAdvance: () => void;
}

export interface MathProblemPlayerProps {
  problem: MathProblem;
  callbacks: MathActivityCallbacks;
}

export interface MathSession {
  id: string;
  topicId: string;
  problems: MathProblem[];
  createdAt: number;
}

export interface MathSessionPlayerProps {
  session: MathSession;
  onSessionComplete: () => void;
  onExit: () => void;
}

/** progressMap is keyed by problemId (not the composite db id). */
export type MathProgressMap = Record<string, MathProgressRow>;
