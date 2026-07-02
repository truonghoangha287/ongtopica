import type { MathTopicId, QuizQuestion } from '@/math/types/math.types';

/**
 * Hive quiz banks — three age-appropriate questions per topic, sequenced per
 * the Constitution's math ladder. Prompts/hints are referenced by i18n key
 * (`quiz.<topic>.<index>.{prompt,hint}`); numerals and math symbols stay as
 * literal, language-neutral option strings. `answer` indexes `options`.
 */
export const MATH_QUIZZES: Record<MathTopicId, QuizQuestion[]> = {
  counting: [
    { type: 'seq', promptKey: 'quiz.counting.0.prompt', hintKey: 'quiz.counting.0.hint', seq: ['6', '7', '8', '9'], options: ['10', '11', '12', '9'], answer: 0 },
    { type: 'seq', promptKey: 'quiz.counting.1.prompt', hintKey: 'quiz.counting.1.hint', seq: ['10', '20', '30', '40'], options: ['41', '50', '60', '45'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.counting.2.prompt', hintKey: 'quiz.counting.2.hint', expr: '29 → ▢', options: ['28', '30', '31', '40'], answer: 1 },
  ],
  addsub: [
    { type: 'expr', promptKey: 'quiz.addsub.0.prompt', hintKey: 'quiz.addsub.0.hint', expr: '7 + 5', options: ['11', '12', '13', '14'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.addsub.1.prompt', hintKey: 'quiz.addsub.1.hint', expr: '13 − 6', options: ['6', '7', '8', '9'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.addsub.2.prompt', hintKey: 'quiz.addsub.2.hint', expr: '9 + ▢ = 15', options: ['4', '5', '6', '7'], answer: 2 },
  ],
  multiply: [
    { type: 'expr', promptKey: 'quiz.multiply.0.prompt', hintKey: 'quiz.multiply.0.hint', expr: '3 × 4', options: ['7', '10', '12', '14'], answer: 2 },
    { type: 'expr', promptKey: 'quiz.multiply.1.prompt', hintKey: 'quiz.multiply.1.hint', expr: '12 ÷ 3', options: ['3', '4', '5', '6'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.multiply.2.prompt', hintKey: 'quiz.multiply.2.hint', expr: '5 × 2', options: ['7', '8', '10', '12'], answer: 2 },
  ],
  fractions: [
    { type: 'expr', promptKey: 'quiz.fractions.0.prompt', hintKey: 'quiz.fractions.0.hint', expr: '½ of 8', options: ['2', '4', '6', '8'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.fractions.1.prompt', hintKey: 'quiz.fractions.1.hint', expr: '½   vs   ¼', options: ['½', '¼'], answer: 0 },
    { type: 'expr', promptKey: 'quiz.fractions.2.prompt', hintKey: 'quiz.fractions.2.hint', expr: '¼ of 12', options: ['2', '3', '4', '6'], answer: 1 },
  ],
  shapes: [
    { type: 'expr', promptKey: 'quiz.shapes.0.prompt', hintKey: 'quiz.shapes.0.hint', expr: '⬡', options: ['5', '6', '7', '8'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.shapes.1.prompt', hintKey: 'quiz.shapes.1.hint', expr: '▲', options: ['2', '3', '4', '5'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.shapes.2.prompt', hintKey: 'quiz.shapes.2.hint', expr: '◼', options: ['3', '4', '5', '6'], answer: 1 },
  ],
  timemoney: [
    { type: 'expr', promptKey: 'quiz.timemoney.0.prompt', hintKey: 'quiz.timemoney.0.hint', expr: '1 hour = ▢', options: ['30', '60', '100', '12'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.timemoney.1.prompt', hintKey: 'quiz.timemoney.1.hint', expr: '5¢ + 5¢', options: ['7¢', '10¢', '15¢', '25¢'], answer: 1 },
    { type: 'expr', promptKey: 'quiz.timemoney.2.prompt', hintKey: 'quiz.timemoney.2.hint', expr: '🕧', options: ['15 min', '30 min', '45 min', '60 min'], answer: 1 },
  ],
  patterns: [
    { type: 'seq', promptKey: 'quiz.patterns.0.prompt', hintKey: 'quiz.patterns.0.hint', seq: ['3', '6', '9', '12'], options: ['13', '14', '15', '16'], answer: 2 },
    { type: 'seq', promptKey: 'quiz.patterns.1.prompt', hintKey: 'quiz.patterns.1.hint', seq: ['2', '4', '8', '16'], options: ['18', '24', '32', '20'], answer: 2 },
    { type: 'seq', promptKey: 'quiz.patterns.2.prompt', hintKey: 'quiz.patterns.2.hint', seq: ['1', '2', '4', '7'], options: ['9', '10', '11', '12'], answer: 2 },
  ],
  logic: [
    { type: 'seq', promptKey: 'quiz.logic.0.prompt', hintKey: 'quiz.logic.0.hint', seq: ['🔺', '🟦', '🔺', '🟦'], options: ['🔺', '🟦', '🟢', '⭐'], answer: 0 },
    { type: 'expr', promptKey: 'quiz.logic.1.prompt', hintKey: 'quiz.logic.1.hint', expr: '2 · 4 · 5 · 8', options: ['2', '4', '5', '8'], answer: 2 },
    { type: 'expr', promptKey: 'quiz.logic.2.prompt', hintKey: 'quiz.logic.2.hint', expr: '🐝 + 🐝', options: ['2', '3', '4', '5'], answer: 2 },
  ],
};

export function getQuiz(topicId: string): QuizQuestion[] {
  return MATH_QUIZZES[topicId as MathTopicId] ?? MATH_QUIZZES.addsub;
}
