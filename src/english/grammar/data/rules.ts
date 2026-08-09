/**
 * The grammar rules the child is drilled on. A rule id is the unit of mastery
 * everywhere in this module: the scheduler weights by rule, the mastery table
 * has one row per rule, and the parent-facing chips show one chip per rule.
 *
 * `plural.irregular` deliberately absorbs the zero-plural words (sheep, fish)
 * alongside man→men. Splitting them would leave a rule with only two source
 * words — below the 4-item minimum the data integrity test enforces — and for
 * a 9-year-old both are the same lesson: this one doesn't follow the rule.
 */

export type PluralRuleId =
  | 'plural.s'
  | 'plural.es'
  | 'plural.ies'
  | 'plural.irregular'
  | 'plural.uncountable'
  | 'plural.tantum';

/** `verb.base` is the counter-rule: "they teach", not "they teaches". */
export type VerbRuleId = 'verb.base' | 'verb.s' | 'verb.es' | 'verb.ies';

export type LetterRuleId = 'letter.bd';

export type RuleId = PluralRuleId | VerbRuleId | LetterRuleId;

export interface Rule {
  id: RuleId;
  /** Short child-facing name, e.g. "add -es". */
  label: string;
  /** One worked example, e.g. "watch → watches". */
  example: string;
}

export const RULES: Rule[] = [
  { id: 'plural.s', label: 'add -s', example: 'cat → cats' },
  { id: 'plural.es', label: 'add -es', example: 'watch → watches' },
  { id: 'plural.ies', label: 'y → -ies', example: 'baby → babies' },
  { id: 'plural.irregular', label: 'special ones', example: 'foot → feet' },
  { id: 'plural.uncountable', label: 'no plural', example: 'some milk' },
  { id: 'plural.tantum', label: 'always plural', example: 'some jeans' },
  { id: 'verb.base', label: 'they + no ending', example: 'they teach' },
  { id: 'verb.s', label: 'add -s', example: 'the dog barks' },
  { id: 'verb.es', label: 'add -es', example: 'the teacher teaches' },
  { id: 'verb.ies', label: 'y → -ies', example: 'the pilot flies' },
  { id: 'letter.bd', label: 'b or d', example: 'dog, not bog' },
];

export const RULE_IDS: RuleId[] = RULES.map((r) => r.id);

export const PLURAL_RULE_IDS = RULE_IDS.filter((id) =>
  id.startsWith('plural.'),
) as PluralRuleId[];

export const VERB_RULE_IDS = RULE_IDS.filter((id) =>
  id.startsWith('verb.'),
) as VerbRuleId[];

export function getRule(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}
