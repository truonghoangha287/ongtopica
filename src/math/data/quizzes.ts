import type { MathTopicId, OlympiadTrack, QuizQuestion } from '@/math/types/math.types';
import { TOPIC_LEVEL_COUNT, OLYMPIAD_DAILY_COUNT } from '@/math/constants/math-constants';

// Generated banks — see `scripts/generate-math-data.ts`. Do not hand-edit the JSON.
import counting from './banks/counting.json';
import addsub from './banks/addsub.json';
import multiply from './banks/multiply.json';
import fractions from './banks/fractions.json';
import shapes from './banks/shapes.json';
import timemoney from './banks/timemoney.json';
import patterns from './banks/patterns.json';
import logic from './banks/logic.json';
import olympiad from './banks/olympiad.json';

/**
 * Full generated question banks, one array per topic. Each question carries a
 * `band` (1–12) matching the journey level it belongs to; `getQuiz` slices the
 * band for the child's current level so difficulty climbs as they progress.
 */
export const MATH_QUIZZES: Record<MathTopicId, QuizQuestion[]> = {
  counting: counting as QuizQuestion[],
  addsub: addsub as QuizQuestion[],
  multiply: multiply as QuizQuestion[],
  fractions: fractions as QuizQuestion[],
  shapes: shapes as QuizQuestion[],
  timemoney: timemoney as QuizQuestion[],
  patterns: patterns as QuizQuestion[],
  logic: logic as QuizQuestion[],
};

const OLYMPIAD_BANK = olympiad as QuizQuestion[];

/** Clamp an arbitrary level into the valid band range [1, TOPIC_LEVEL_COUNT]. */
export function bandForLevel(level: number): number {
  if (!Number.isFinite(level) || level < 1) return 1;
  return Math.min(Math.floor(level), TOPIC_LEVEL_COUNT);
}

/**
 * The hive quiz for a topic at a given journey level: every question in that
 * level's difficulty band. Falls back to band 1 for an unknown topic/level so a
 * child never hits an empty quiz.
 */
export function getQuiz(topicId: string, level = 1): QuizQuestion[] {
  const bank = MATH_QUIZZES[topicId as MathTopicId] ?? MATH_QUIZZES.addsub;
  const band = bandForLevel(level);
  const questions = bank.filter((q) => q.band === band);
  return questions.length > 0 ? questions : bank.filter((q) => q.band === 1);
}

/** Today's Bee Olympiad set for a track — a fixed-size slice of the track's bank. */
export function getOlympiadQuiz(track: OlympiadTrack): QuizQuestion[] {
  const bank = OLYMPIAD_BANK.filter((q) => q.track === track);
  return bank.slice(0, OLYMPIAD_DAILY_COUNT);
}

/** How many puzzles a given Olympiad track serves per day (for banners/counters). */
export function olympiadCount(track: OlympiadTrack): number {
  return getOlympiadQuiz(track).length;
}
