/**
 * Number Lab question-bank generator.
 *
 * The Number Lab is the ≤10 practice pillar: it teaches equations where the
 * unknown is NOT at the end (`10 − ▢ = 8`, `▢ − 2 = 3`), which is where young
 * children reading left-to-right as an instruction come unstuck. Output is
 * written to `src/math/data/banks/numberlab.json`. That file is GENERATED: do
 * not hand-edit it; change the stage makers below and re-run.
 *
 *   npm run gen:numberlab
 *
 * Design notes
 * ------------
 * - Six STAGES map 1:1 onto the question `band`, ordered by family rather than
 *   magnitude: facts → bonds to 10 → missing addend → missing in subtraction →
 *   fact families → comparison. Every stage stays inside 0..10.
 * - Answers are given by TAPPING A NUMBER (`input: 'tiles'`) or a comparison
 *   glyph (`input: 'symbols'`) — never by picking one of four near-misses, so a
 *   right answer means the child actually knew it.
 * - Each stage holds `WINDOWS` windows of `STAGE_SIZE` questions. One attempt
 *   plays one window, so a replay is not the same ten questions. Duplicates are
 *   removed WITHIN a window (repetition across windows is drill, not a bug).
 * - Fact families are emitted as ordered PAIRS (`3 + 5 = ▢` then `8 − 5 = ▢`)
 *   and a pair is never split across a window boundary.
 * - Generation is seeded (mulberry32) → identical output every run, stable ids.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Local mirror of the domain type (kept standalone so the script has no `src` deps).
// ---------------------------------------------------------------------------
interface Question {
  id: string;
  band: number; // 1..STAGES.length — the practice stage
  type: 'expr';
  promptKey: string;
  hintKey: string;
  expr: string;
  options: string[];
  answer: number;
  input: 'tiles' | 'symbols';
  answerValue?: number;
  tenFrame?: number;
  vars?: Record<string, string | number>;
}

const TOPIC = 'numberlab';
const STAGES = ['sums', 'bonds', 'addend', 'takeaway', 'factfam', 'compare'] as const;
type Stage = (typeof STAGES)[number];

/** The whole Number Lab lives in 0..10 (mirrors NUMBER_TILE_MAX). */
const MAX = 10;
/** Questions per attempt (mirrors PRACTICE_STAGE_SIZE). */
const STAGE_SIZE = 10;
/** Rotating windows per stage (mirrors PRACTICE_WINDOWS). */
const WINDOWS = 3;

// ---------------------------------------------------------------------------
// Seeded RNG + tiny helpers.
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;

const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

const k = (name: string) => ({
  promptKey: `quiz.${TOPIC}.tpl.${name}.prompt`,
  hintKey: `quiz.${TOPIC}.tpl.${name}.hint`,
});

/**
 * A tile question: the child taps `value` on the 0–10 strip. `options` holds the
 * single correct label so `options[answer]` still reveals the right answer to
 * every consumer that expects a choice question.
 */
function tile(name: string, expr: string, value: number, extra: Partial<Question> = {}): Question {
  return {
    id: '',
    band: 0,
    type: 'expr',
    ...k(name),
    expr,
    options: [String(value)],
    answer: 0,
    input: 'tiles',
    answerValue: value,
    ...extra,
  };
}

/** A comparison question. Glyph order is FIXED so the buttons never move. */
function symbols(a: number, b: number): Question {
  const opts = ['<', '>', '='];
  return {
    id: '',
    band: 0,
    type: 'expr',
    ...k('compare'),
    expr: `${a} ▢ ${b}`,
    options: opts,
    answer: a < b ? 0 : a > b ? 1 : 2,
    input: 'symbols',
  };
}

/** Stable identity for a rendered question, used to keep a window duplicate-free. */
function fingerprint(q: Question): string {
  return `${q.input}|${q.expr}|${q.answerValue ?? q.options[q.answer]}`;
}

/**
 * Fill ONE window of `size` questions.
 *
 * `make` returns a GROUP — usually one question, but two for a fact family. A
 * group is added whole or not at all, so a pair can never be split across the
 * window edge and leave its second half orphaned in the next attempt.
 */
function fillWindow(make: () => Question[], size: number): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (let attempt = 0; out.length < size && attempt < size * 400; attempt++) {
    const group = make();
    if (out.length + group.length > size) continue;
    const fps = group.map(fingerprint);
    if (fps.some((f) => seen.has(f))) continue;
    for (const f of fps) seen.add(f);
    out.push(...group);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Stage makers. Each returns one group of questions, all values within 0..MAX.
// ---------------------------------------------------------------------------

/** Stage 1 — the facts she already owns, rebuilt as a confident base. */
function makeSums(rng: Rng): Question[] {
  if (rng() < 0.5) {
    const a = randInt(rng, 1, MAX - 1);
    const b = randInt(rng, 1, MAX - a);
    return [tile('add', `${a} + ${b}`, a + b)];
  }
  const a = randInt(rng, 2, MAX);
  const b = randInt(rng, 1, a);
  return [tile('sub', `${a} − ${b}`, a - b)];
}

/**
 * Stage 2 — number bonds to 10. The ten-frame always shows the KNOWN part, so
 * the answer is literally the empty cells the child can see and count.
 */
function makeBonds(rng: Rng): Question[] {
  const known = randInt(rng, 1, MAX - 1);
  const missing = MAX - known;
  const frame = { tenFrame: known };
  const form = randInt(rng, 0, 2);
  if (form === 0) return [tile('bondStart', `▢ + ${known} = ${MAX}`, missing, frame)];
  if (form === 1) return [tile('bondEnd', `${known} + ▢ = ${MAX}`, missing, frame)];
  return [tile('bondSub', `${MAX} − ${known} = ▢`, missing, frame)];
}

/** Stage 3 — the unknown moves into an addition, in either position. */
function makeMissingAddend(rng: Rng): Question[] {
  const total = randInt(rng, 3, MAX);
  const a = randInt(rng, 1, total - 1);
  const b = total - a;
  return rng() < 0.5
    ? [tile('addendStart', `▢ + ${b} = ${total}`, a)]
    : [tile('addendEnd', `${a} + ▢ = ${total}`, b)];
}

/**
 * Stage 4 — the exact confusion: an unknown inside a subtraction, as either the
 * number being taken from (`▢ − 2 = 3`) or the amount taken (`10 − ▢ = 8`).
 */
function makeMissingInSub(rng: Rng): Question[] {
  const whole = randInt(rng, 3, MAX);
  const part = randInt(rng, 1, whole - 1);
  const rest = whole - part;
  return rng() < 0.5
    ? [tile('missingMinuend', `▢ − ${part} = ${rest}`, whole)]
    : [tile('missingSubtrahend', `${whole} − ▢ = ${rest}`, part)];
}

/**
 * Stage 5 — a fact family as an ordered pair: find `a + b`, then immediately
 * undo it. Seeing subtraction as the reverse of an addition she just did is
 * what makes `10 − ▢ = 8` stop being a puzzle.
 */
function makeFactPair(rng: Rng): Question[] {
  const a = randInt(rng, 1, MAX - 1);
  const b = randInt(rng, 1, MAX - a);
  const c = a + b;
  return [
    tile('factAdd', `${a} + ${b}`, c, { vars: { a, b, c } }),
    tile('factRelated', `${c} − ${b}`, a, { vars: { a, b, c } }),
  ];
}

/** Stage 6 — comparing and ordering: `< > =`, plus one more / one less. */
function makeCompare(rng: Rng): Question[] {
  const roll = rng();
  if (roll < 0.5) {
    const a = randInt(rng, 0, MAX);
    // Force a genuine tie sometimes, so "=" is a live answer and not decoration.
    const b = rng() < 0.2 ? a : randInt(rng, 0, MAX);
    return [symbols(a, b)];
  }
  // One more / one less show the number alone and put the direction in the
  // prompt: an arrow glyph would be one more thing to decode, and decoding is
  // exactly what this stage is trying to remove.
  if (roll < 0.75) {
    const a = randInt(rng, 0, MAX - 1);
    return [tile('oneMore', `${a}`, a + 1, { vars: { n: a } })];
  }
  const a = randInt(rng, 1, MAX);
  return [tile('oneLess', `${a}`, a - 1, { vars: { n: a } })];
}

const MAKERS: Record<Stage, (rng: Rng) => Question[]> = {
  sums: makeSums,
  bonds: makeBonds,
  addend: makeMissingAddend,
  takeaway: makeMissingInSub,
  factfam: makeFactPair,
  compare: makeCompare,
};

// ---------------------------------------------------------------------------
// Build + write.
// ---------------------------------------------------------------------------

/** Stable seed so the bank is independent of the other generators yet reproducible. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const rng = mulberry32(hashSeed(TOPIC));
const all: Question[] = [];

for (const [i, stage] of STAGES.entries()) {
  const band = i + 1;
  const make = MAKERS[stage];
  const questions: Question[] = [];
  for (let w = 0; w < WINDOWS; w++) {
    questions.push(...fillWindow(() => make(rng), STAGE_SIZE));
  }
  questions.forEach((q, idx) => {
    q.band = band;
    q.id = `${TOPIC}-b${band}-${idx}`;
  });
  all.push(...questions);
}

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../src/math/data/banks');
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, `${TOPIC}.json`), JSON.stringify(all, null, 2) + '\n');

console.log(`Number Lab bank written to ${OUT_DIR}/${TOPIC}.json`);
for (const [i, stage] of STAGES.entries()) {
  const n = all.filter((q) => q.band === i + 1).length;
  console.log(`  ${String(i + 1)}. ${stage.padEnd(9)} ${String(n).padStart(3)} questions`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(all.length).padStart(3)} questions`);
