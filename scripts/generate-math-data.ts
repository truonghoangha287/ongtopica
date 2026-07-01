/**
 * Deterministic generator for the Math Foundations problem sets.
 *
 *   pnpm exec tsx scripts/generate-math-data.ts
 *
 * Emits one JSON file per topic into src/data/math-starters/. No Math.random():
 * ids and choice ordering are stable across runs, so data diffs are meaningful
 * and tests can assert on membership. Each problem bakes in its 3 choices and the
 * id of the correct one, so the runtime never has to synthesise distractors.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'math-starters');

const NUM_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
];
const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'diamond', 'oval'];

type Payload = { label?: string; emoji?: string; shape?: string; count?: number };
type Choice = { id: string; label?: string; emoji?: string; shape?: string; count?: number };

/** Place the correct payload at a rotating index so the answer is not always first. */
function buildChoices(correct: Payload, distractors: Payload[], idx: number) {
  const answerIndex = idx % 3;
  const others = distractors.slice(0, 2);
  const arranged: Payload[] = [];
  let d = 0;
  for (let i = 0; i < 3; i++) arranged[i] = i === answerIndex ? correct : others[d++];
  const choices: Choice[] = arranged.map((p, i) => ({ id: `c${i}`, ...p }));
  return { choices, answerId: `c${answerIndex}` };
}

/** Two near-miss numerals within [min,max], deterministic. */
function numDistractors(answer: number, min: number, max: number): number[] {
  const offsets = [1, -1, 2, -2, 3, -3, 4, -4];
  const out: number[] = [];
  for (const o of offsets) {
    const v = answer + o;
    if (v >= min && v <= max && v !== answer && !out.includes(v)) out.push(v);
    if (out.length >= 2) break;
  }
  let v = min;
  while (out.length < 2 && v <= max + 6) {
    if (v !== answer && !out.includes(v)) out.push(v);
    v++;
  }
  return out.slice(0, 2);
}

const numPayload = (n: number): Payload => ({ label: String(n) });
const pad = (n: number) => String(n).padStart(2, '0');

interface Problem {
  id: string;
  topicId: string;
  type: string;
  prompt: Record<string, unknown>;
  choices: Choice[];
  answerId: string;
  narration: string;
}

// ----------------------------- Topic builders ----------------------------- //

function numbers(): Problem[] {
  const out: Problem[] = [];
  let i = 0;
  // Quantity → numeral (dot recognition), 1..8
  for (let n = 1; n <= 8; n++) {
    const ds = numDistractors(n, 1, 10).map(numPayload);
    const { choices, answerId } = buildChoices(numPayload(n), ds, i);
    out.push({
      id: `numbers.dots${pad(n)}`, topicId: 'numbers', type: 'tap-number',
      prompt: { kind: 'dots', count: n, emoji: '🔵' }, choices, answerId,
      narration: 'How many dots are there? Tap the number.',
    });
    i++;
  }
  // Number word → numeral (symbol literacy)
  for (const n of [9, 10, 11, 12, 15, 20]) {
    const ds = numDistractors(n, 1, 20).map(numPayload);
    const { choices, answerId } = buildChoices(numPayload(n), ds, i);
    out.push({
      id: `numbers.word${pad(n)}`, topicId: 'numbers', type: 'tap-number',
      prompt: { kind: 'word', value: NUM_WORDS[n] }, choices, answerId,
      narration: `Find the number ${NUM_WORDS[n]}.`,
    });
    i++;
  }
  return out;
}

function counting(): Problem[] {
  const emojis = ['🍎', '🦆', '⭐', '🐟', '🌸', '🚗', '🍌', '🐝'];
  const counts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 3, 5, 6, 4, 7];
  return counts.map((n, i) => {
    const ds = numDistractors(n, 1, 10).map(numPayload);
    const { choices, answerId } = buildChoices(numPayload(n), ds, i);
    return {
      id: `counting.${pad(n)}_${i}`, topicId: 'counting', type: 'count-objects',
      prompt: { kind: 'dots', count: n, emoji: emojis[i % emojis.length] }, choices, answerId,
      narration: 'Count them. How many are there?',
    };
  });
}

function addition(): Problem[] {
  const pairs: Array<[number, number]> = [
    [1, 1], [2, 1], [2, 2], [3, 1], [3, 2], [2, 3], [4, 1], [3, 3],
    [4, 2], [5, 2], [4, 3], [5, 3], [6, 2], [5, 4],
  ];
  return pairs.map(([a, b], i) => {
    const sum = a + b;
    const ds = numDistractors(sum, 0, 20).map(numPayload);
    const { choices, answerId } = buildChoices(numPayload(sum), ds, i);
    return {
      id: `addition.${a}plus${b}`, topicId: 'addition', type: 'tap-number',
      prompt: { kind: 'expression', value: `${a} + ${b}` }, choices, answerId,
      narration: `What is ${NUM_WORDS[a]} plus ${NUM_WORDS[b]}?`,
    };
  });
}

function subtraction(): Problem[] {
  const pairs: Array<[number, number]> = [
    [2, 1], [3, 1], [3, 2], [4, 1], [4, 2], [5, 2], [5, 3], [6, 2],
    [6, 4], [7, 3], [8, 2], [9, 4], [10, 5], [8, 6],
  ];
  return pairs.map(([a, b], i) => {
    const diff = a - b;
    const ds = numDistractors(diff, 0, 20).map(numPayload);
    const { choices, answerId } = buildChoices(numPayload(diff), ds, i);
    return {
      id: `subtraction.${a}minus${b}`, topicId: 'subtraction', type: 'tap-number',
      prompt: { kind: 'expression', value: `${a} - ${b}` }, choices, answerId,
      narration: `What is ${NUM_WORDS[a]} minus ${NUM_WORDS[b]}?`,
    };
  });
}

function patterns(): Problem[] {
  // Each entry: the repeating alphabet and how many items to show before the "?".
  const defs: Array<{ alphabet: string[]; show: number }> = [
    { alphabet: ['🔴', '🔵'], show: 4 },
    { alphabet: ['⭐', '🌙'], show: 5 },
    { alphabet: ['🍎', '🍌'], show: 4 },
    { alphabet: ['🔺', '⬛'], show: 5 },
    { alphabet: ['🟢', '🟡', '🔵'], show: 5 },
    { alphabet: ['🐶', '🐱'], show: 6 },
    { alphabet: ['☀️', '☁️'], show: 4 },
    { alphabet: ['🟥', '🟥', '🟦'], show: 5 },
    { alphabet: ['🚗', '🚙', '🚕'], show: 5 },
    { alphabet: ['🌸', '🌼'], show: 6 },
    { alphabet: ['⬆️', '➡️'], show: 4 },
    { alphabet: ['🟠', '🟣'], show: 5 },
  ];
  // Distinct filler emojis so a small (e.g. 2-item) alphabet still yields two
  // visually-different distractors — never a second tile identical to the answer.
  const FALLBACK = ['🟢', '🟣', '🟠', '🔶', '🟤', '⚫'];
  return defs.map((def, i) => {
    const seq = Array.from({ length: def.show }, (_, k) => ({
      id: `seq${k}`, emoji: def.alphabet[k % def.alphabet.length],
    }));
    const nextEmoji = def.alphabet[def.show % def.alphabet.length];
    // Prefer the natural "other" alphabet member first, then distinct fillers.
    const pool = [...new Set([...def.alphabet, ...FALLBACK])].filter((e) => e !== nextEmoji);
    const ds = pool.slice(0, 2).map((e) => ({ emoji: e }));
    const { choices, answerId } = buildChoices({ emoji: nextEmoji }, ds, i);
    return {
      id: `patterns.${i}`, topicId: 'patterns', type: 'pick-next',
      prompt: { kind: 'sequence', sequence: [...seq, { id: 'q', label: '?' }] },
      choices, answerId, narration: 'What comes next?',
    };
  });
}

function shapes(): Problem[] {
  const out: Problem[] = [];
  // One round over every shape, then a second round for the first four (repetition aids recall).
  const rounds = [...SHAPES, ...SHAPES.slice(0, 4)];
  rounds.forEach((shape, i) => {
    const distractorShapes = SHAPES.filter((s) => s !== shape).slice(i % 3, (i % 3) + 2);
    while (distractorShapes.length < 2) distractorShapes.push(SHAPES.filter((s) => s !== shape)[0]);
    const ds = distractorShapes.map((s) => ({ shape: s }));
    const { choices, answerId } = buildChoices({ shape }, ds, i);
    out.push({
      id: `shapes.${shape}_${i}`, topicId: 'shapes', type: 'tap-shape',
      prompt: { kind: 'shape-name', value: shape, i18nKey: 'prompts.tapShape' },
      choices, answerId, narration: `Tap the ${shape}.`,
    });
  });
  return out;
}

function logic(): Problem[] {
  const out: Problem[] = [];
  // Odd-one-out: two same + one different; tap the different one.
  const odd: Array<[string, string]> = [
    ['🍎', '🍌'], ['🔵', '🔴'], ['🐶', '🐱'], ['⭐', '🌙'], ['🚗', '✈️'],
    ['🟢', '🟥'], ['🍓', '🥕'], ['🐸', '🐟'], ['☀️', '🌧️'], ['🎈', '⚽'],
  ];
  odd.forEach(([same, different], i) => {
    // Two "same" payloads + one "different"; the different one is the answer.
    const { choices, answerId } = buildChoices({ emoji: different }, [{ emoji: same }, { emoji: same }], i);
    out.push({
      id: `logic.odd${i}`, topicId: 'logic', type: 'odd-one-out',
      prompt: { kind: 'instruction', i18nKey: 'prompts.oddOneOut' },
      choices, answerId, narration: 'Which one is different?',
    });
  });
  // "Which group has more?" — choices are clusters; the largest count is the answer.
  const more: Array<[number, number, number]> = [
    [4, 2, 3], [5, 1, 2], [6, 3, 2], [3, 6, 5],
  ];
  more.forEach(([a, b, c], i) => {
    const max = Math.max(a, b, c);
    const counts = [a, b, c];
    const answerIndex = counts.indexOf(max);
    const choices: Choice[] = counts.map((n, k) => ({ id: `c${k}`, emoji: '🟡', count: n }));
    out.push({
      id: `logic.more${i}`, topicId: 'logic', type: 'odd-one-out',
      prompt: { kind: 'instruction', i18nKey: 'prompts.whichMore' },
      choices, answerId: `c${answerIndex}`, narration: 'Which group has more?',
    });
  });
  return out;
}

const TOPICS: Record<string, () => Problem[]> = {
  numbers, counting, addition, subtraction, patterns, shapes, logic,
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, build] of Object.entries(TOPICS)) {
  const problems = build();
  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(problems, null, 2) + '\n', 'utf8');
  // eslint-disable-next-line no-console
  console.log(`  ${name}.json — ${problems.length} problems`);
}
// eslint-disable-next-line no-console
console.log('Math data generated.');
