// Skill-first information architecture.
//
// The app is organized as Skill → Topic (word set) → Activities. A "skill" is a
// Cambridge YLE strand (Listening, Reading & Writing, Vocabulary Games); Speaking
// is deferred (spec 003). Each skill exposes a set of activities that run against a
// topic's word set, reusing the existing session/game engines. Adding a skill or an
// activity is a data-only change here — no page rewrites.

export type SkillId = 'listening' | 'reading-writing' | 'vocab-games';

export interface SkillDef {
  id: SkillId;
  emoji: string;
  /** Accent CSS custom-property used for the skill card. */
  accent: string;
}

export const SKILLS: readonly SkillDef[] = [
  { id: 'listening', emoji: '🎧', accent: 'var(--primary)' },
  { id: 'reading-writing', emoji: '✍️', accent: 'var(--secondary)' },
  { id: 'vocab-games', emoji: '🎲', accent: 'var(--success)' },
] as const;

export function getSkill(id: string | undefined): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

/**
 * A per-topic activity offered inside a skill. Each variant maps onto an existing
 * engine: `stage` composes a stage-filtered word session, `listen-match` composes a
 * listen-and-match session, `memory` routes to the Memory Match game.
 */
export type TopicActivity =
  | { kind: 'stage'; stage: 1 | 2 | 3 | 4; i18nKey: string; emoji: string }
  | { kind: 'listen-match'; i18nKey: string; emoji: string }
  | { kind: 'memory'; i18nKey: string; emoji: string };

export const SKILL_ACTIVITIES: Record<SkillId, readonly TopicActivity[]> = {
  listening: [
    { kind: 'stage', stage: 1, i18nKey: 'wordSetPage.stageIntroduce', emoji: '🎧' },
    { kind: 'listen-match', i18nKey: 'wordSetPage.listenMatch', emoji: '👂' },
    { kind: 'stage', stage: 2, i18nKey: 'wordSetPage.stageRecognize', emoji: '❓' },
  ],
  'reading-writing': [
    { kind: 'stage', stage: 3, i18nKey: 'wordSetPage.stageUnscramble', emoji: '🔤' },
    { kind: 'stage', stage: 4, i18nKey: 'wordSetPage.stageFillInBlank', emoji: '✏️' },
  ],
  'vocab-games': [{ kind: 'memory', i18nKey: 'wordSetPage.memoryMatch', emoji: '🧠' }],
};

/**
 * Cross-cutting Reading & Writing sentence activities. Unlike topic activities these
 * are not scoped to a single word set, so they live at the skill level (on the
 * Reading & Writing hub) and route to their standalone pages.
 */
export const SENTENCE_ACTIVITIES = [
  { key: 'wordCloze', emoji: '📖', route: '/rw/cloze' },
  { key: 'yesNo', emoji: '✅', route: '/rw/yes-no' },
  { key: 'preposition', emoji: '📦', route: '/rw/preposition' },
  { key: 'pictureQa', emoji: '🖼️', route: '/rw/picture-qa' },
] as const;
