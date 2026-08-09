import { starCount } from '@/english/vocab/components/star-row';
import type { WordProgressRow } from '@/shared/db/schema';
import type { WordSet } from '@/shared/types';

/** Skills that are practised one topic at a time. */
export type TopicSkillId = 'listening' | 'reading' | 'vocab';

/**
 * Every skill on the English home. `grammar` is deliberately not a
 * `TopicSkillId`: grammar rules are cross-topic, so "how is grammar going in
 * the Animals topic?" is a question with no answer, and the compiler should
 * reject it rather than a function returning a meaningless 0.
 */
export type SkillId = TopicSkillId | 'grammar';

/** How an activity is launched once a topic (word set) is chosen. */
export type ActivityLaunch =
  | { kind: 'session'; stage: 1 | 2 | 3 | 4 }
  | { kind: 'listenMatch' }
  | { kind: 'memory' }
  | { kind: 'route'; route: string };

export interface SkillActivity {
  id: string;
  /** i18n key (vocab namespace) for the activity's display name. */
  i18nKey: string;
  emoji: string;
  /** Short child-friendly blurb. */
  desc: string;
  launch: ActivityLaunch;
  /**
   * Whether the activity draws its content from the chosen topic. Scoped
   * activities count towards a topic's "done" state; unscoped ones (the
   * cross-topic sentence/picture games) are always available to play.
   */
  scoped: boolean;
}

export interface Skill {
  id: SkillId;
  title: string;
  emoji: string;
  blurb: string;
  /** CSS custom-property references for this skill's accent + soft tint. */
  accent: string;
  soft: string;
}

export const SKILLS: Skill[] = [
  {
    id: 'listening',
    title: 'Listening',
    emoji: '🎧',
    blurb: 'Hear it, find it',
    accent: 'var(--sk-listen)',
    soft: 'var(--sk-listen-soft)',
  },
  {
    id: 'reading',
    title: 'Reading & Writing',
    emoji: '✍️',
    blurb: 'Read words & sentences',
    accent: 'var(--sk-read)',
    soft: 'var(--sk-read-soft)',
  },
  {
    id: 'vocab',
    title: 'Vocabulary',
    emoji: '🧩',
    blurb: 'Play word games',
    accent: 'var(--sk-vocab)',
    soft: 'var(--sk-vocab-soft)',
  },
  {
    id: 'grammar',
    title: 'Grammar',
    emoji: '🪄',
    blurb: 'Fix the word endings',
    accent: 'var(--sk-grammar, var(--primary))',
    soft: 'var(--sk-grammar-soft, var(--muted))',
  },
];

export const SKILL_ACTIVITIES: Record<SkillId, SkillActivity[]> = {
  listening: [
    { id: 'listen-learn', i18nKey: 'wordSetPage.stageIntroduce', emoji: '🎧', desc: 'Meet new words', launch: { kind: 'session', stage: 1 }, scoped: true },
    { id: 'recognise', i18nKey: 'wordSetPage.stageRecognize', emoji: '👂', desc: 'Hear it, tap the picture', launch: { kind: 'session', stage: 2 }, scoped: true },
    { id: 'listen-match', i18nKey: 'wordSetPage.listenMatch', emoji: '🔗', desc: 'Match what you hear', launch: { kind: 'listenMatch' }, scoped: true },
  ],
  reading: [
    { id: 'unscramble', i18nKey: 'wordSetPage.stageUnscramble', emoji: '🔤', desc: 'Spell the word', launch: { kind: 'session', stage: 3 }, scoped: true },
    { id: 'fill-letter', i18nKey: 'wordSetPage.stageFillInBlank', emoji: '✏️', desc: 'Find the missing letter', launch: { kind: 'session', stage: 4 }, scoped: true },
    { id: 'cloze', i18nKey: 'readingWriting.wordCloze', emoji: '📖', desc: 'Fill the gap with a word', launch: { kind: 'route', route: '/rw/cloze' }, scoped: false },
    { id: 'yes-no', i18nKey: 'readingWriting.yesNo', emoji: '✅', desc: 'Is the sentence true?', launch: { kind: 'route', route: '/rw/yes-no' }, scoped: false },
    { id: 'preposition', i18nKey: 'readingWriting.preposition', emoji: '📦', desc: 'in · on · under', launch: { kind: 'route', route: '/rw/preposition' }, scoped: false },
  ],
  vocab: [
    { id: 'memory', i18nKey: 'wordSetPage.memoryMatch', emoji: '🧠', desc: 'Find the pairs', launch: { kind: 'memory' }, scoped: true },
    { id: 'picture-qa', i18nKey: 'readingWriting.pictureQa', emoji: '🖼️', desc: 'Answer about the picture', launch: { kind: 'route', route: '/rw/picture-qa' }, scoped: false },
  ],
  grammar: [
    { id: 'plurals', i18nKey: 'grammar.plurals', emoji: '🍎', desc: 'One apple or three?', launch: { kind: 'route', route: '/grammar/plurals' }, scoped: false },
    { id: 'verbs', i18nKey: 'grammar.verbs', emoji: '👩‍🏫', desc: 'Pick the right ending', launch: { kind: 'route', route: '/grammar/verbs' }, scoped: false },
    { id: 'bd', i18nKey: 'grammar.bd', emoji: '🐶', desc: 'Which letter is it?', launch: { kind: 'route', route: '/grammar/bd' }, scoped: false },
  ],
};

export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id);
}

/** Mean stars-per-word (0–4) for a word set. */
export function starMean(wordSet: WordSet, progressMap: Record<string, WordProgressRow>): number {
  if (wordSet.words.length === 0) return 0;
  const total = wordSet.words.reduce((sum, w) => sum + starCount(progressMap[w.id]), 0);
  return total / wordSet.words.length;
}

/**
 * Progress (0–1) for one skill within one topic. Stars 1–2 come from Listening
 * work, stars 3–4 from Reading & Writing; Vocabulary reflects overall mastery.
 */
export function skillTopicProgress(
  skillId: TopicSkillId,
  wordSet: WordSet,
  progressMap: Record<string, WordProgressRow>,
): number {
  const mean = starMean(wordSet, progressMap); // 0..4
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  switch (skillId) {
    case 'listening':
      return clamp01(mean / 2);
    case 'reading':
      return clamp01((mean - 2) / 2);
    case 'vocab':
      return clamp01(mean / 4);
  }
}

/** Aggregate progress (0–1) for a skill across every topic. */
export function skillAggregateProgress(
  skillId: TopicSkillId,
  wordSets: WordSet[],
  progressBySet: Record<string, Record<string, WordProgressRow>>,
): number {
  if (wordSets.length === 0) return 0;
  const sum = wordSets.reduce(
    (acc, ws) => acc + skillTopicProgress(skillId, ws, progressBySet[ws.id] ?? {}),
    0,
  );
  return sum / wordSets.length;
}
