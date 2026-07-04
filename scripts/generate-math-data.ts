/**
 * Math World question-bank generator.
 *
 * Produces the large, deterministic quiz banks the Skills Hive and Bee Olympiad
 * consume. Output is written to `src/math/data/banks/*.json` — one file per
 * topic plus `olympiad.json`. These files are GENERATED: do not hand-edit them;
 * change the band specs below and re-run.
 *
 *   npx tsx scripts/generate-math-data.ts
 *
 * Design notes
 * ------------
 * - Twelve difficulty BANDS per topic map 1:1 onto the twelve journey levels
 *   (`TOPIC_LEVEL_COUNT`). A child at level N plays band N (clamped 1..12), so
 *   the questions genuinely get harder as they climb.
 * - Every band is filled to exactly `PER_BAND` (20) unique questions, so each
 *   stage of a topic journey is a full 20-question quiz.
 * - Prompts/hints are TEMPLATE i18n keys (`quiz.<topic>.tpl.<name>.{prompt,hint}`),
 *   a small fixed pool shared by every generated question. The numbers/symbols
 *   themselves live in the language-neutral `expr`/`seq`/`options` fields, so the
 *   bank scales to hundreds of items without bloating the locale file.
 * - Generation is seeded (mulberry32) → identical output every run, stable ids.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Local mirror of the domain type (kept standalone so the script has no `src` deps).
// ---------------------------------------------------------------------------
type QType = 'seq' | 'expr';
interface Question {
  id: string;
  band: number; // 1..12 (topic banks) — difficulty / journey level
  type: QType;
  promptKey: string;
  hintKey: string;
  seq?: string[];
  expr?: string;
  options: string[];
  answer: number;
  track?: 'kangaroo' | 'sasmo'; // olympiad only
}

const TOPICS = ['counting', 'addsub', 'multiply', 'fractions', 'shapes', 'timemoney', 'patterns', 'logic'] as const;
const BANDS = 12;
/** Questions per difficulty band — one full quiz per journey stage. */
const PER_BAND = 20;

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
const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a multiple-choice option set from a correct value + plausible near-misses. */
function mcq(rng: Rng, correct: number, spreads: number[]): { options: string[]; answer: number } {
  const distractors = new Set<number>();
  for (const d of shuffle(rng, spreads)) {
    const v = correct + d;
    if (v >= 0 && v !== correct) distractors.add(v);
    if (distractors.size >= 3) break;
  }
  let extra = correct + 4;
  while (distractors.size < 3) {
    if (extra !== correct && extra >= 0) distractors.add(extra);
    extra++;
  }
  const opts = shuffle(rng, [correct, ...distractors]);
  return { options: opts.map(String), answer: opts.indexOf(correct) };
}

/** MCQ over a fixed set of string choices (correct must be one of them). */
function mcqStr(rng: Rng, correct: string, distractors: string[]): { options: string[]; answer: number } {
  const opts = shuffle(rng, [correct, ...distractors]);
  return { options: opts, answer: opts.indexOf(correct) };
}

const k = (topic: string, name: string) => ({
  promptKey: `quiz.${topic}.tpl.${name}.prompt`,
  hintKey: `quiz.${topic}.tpl.${name}.hint`,
});

/** Stable identity for a rendered question, used to keep a band free of duplicates. */
function fingerprint(q: Question): string {
  return `${q.type}|${q.expr ?? ''}|${(q.seq ?? []).join(',')}|${q.options[q.answer]}`;
}

/**
 * Draw unique questions from `make` until the band holds `PER_BAND` of them.
 * `make` returns one random question; collisions are discarded and retried. The
 * attempt cap is a safety net — every band's generator is designed to have far
 * more than `PER_BAND` distinct questions available.
 */
function fillBand(make: () => Question): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (let attempt = 0; out.length < PER_BAND && attempt < PER_BAND * 200; attempt++) {
    const q = make();
    const fp = fingerprint(q);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push(q);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-topic band generators. Each returns exactly PER_BAND questions per band.
// Ranges climb steeply across bands so difficulty genuinely ramps.
// ---------------------------------------------------------------------------

function genCounting(rng: Rng): Question[] {
  // Bigger strides, sooner — bands 9-12 count in 25s/50s/100s/250s.
  const steps = [1, 1, 2, 2, 5, 5, 10, 10, 25, 50, 100, 250];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const step = steps[band - 1];
    out.push(
      ...fillBand(() => {
        if (rng() < 0.75) {
          // Extend a skip-counting run of four tiles.
          const start = randInt(rng, 2, 30 + band * 4) * step;
          const seq = [start, start + step, start + 2 * step, start + 3 * step];
          const answer = start + 4 * step;
          const { options, answer: ai } = mcq(rng, answer, [step, -step, 2 * step, step + 1, 1, -1]);
          return { id: '', band, type: 'seq', ...k('counting', 'next'), seq: seq.map(String), options, answer: ai };
        }
        // "What comes after" a larger number.
        const n = randInt(rng, 20 * band, 80 * band + 40);
        const { options, answer } = mcq(rng, n + 1, [1, -1, 2, -2, 10, -10]);
        return { id: '', band, type: 'expr', ...k('counting', 'after'), expr: `${n} → ▢`, options, answer };
      }),
    );
  }
  return out;
}

function genAddSub(rng: Rng): Question[] {
  // Sums climb into the hundreds by the top bands.
  const sumMax = [12, 18, 25, 35, 50, 70, 90, 120, 160, 220, 320, 500];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const max = sumMax[band - 1];
    out.push(
      ...fillBand(() => {
        const roll = rng();
        if (roll < 0.45) {
          const a = randInt(rng, Math.max(2, Math.floor(max / 4)), max - 1);
          const b = randInt(rng, 1, max - a);
          const { options, answer } = mcq(rng, a + b, [1, -1, 2, -2, 10, -10, 3]);
          return { id: '', band, type: 'expr', ...k('addsub', 'add'), expr: `${a} + ${b}`, options, answer };
        }
        if (roll < 0.75) {
          const c = randInt(rng, Math.max(3, Math.floor(max / 2)), max);
          const b = randInt(rng, 1, c - 1);
          const { options, answer } = mcq(rng, c - b, [1, -1, 2, -2, 3, -3, 10]);
          return { id: '', band, type: 'expr', ...k('addsub', 'sub'), expr: `${c} − ${b}`, options, answer };
        }
        const c = randInt(rng, Math.max(4, Math.floor(max / 2)), max);
        const a = randInt(rng, 1, c - 1);
        const { options, answer } = mcq(rng, c - a, [1, -1, 2, -2, 3, 10]);
        return { id: '', band, type: 'expr', ...k('addsub', 'missing'), expr: `${a} + ▢ = ${c}`, options, answer };
      }),
    );
  }
  return out;
}

function genMultiply(rng: Rng): Question[] {
  // Multiplication is age-gated. A 6-year-old can't multiply and a 7-year-old is
  // only just starting, so the earliest bands introduce it as "small groups of"
  // — the ×2 table with tiny multipliers (2×2 … 2×5) that a child can reach by
  // repeated addition. Harder tables and bigger multipliers arrive only as the
  // band (journey level, ≈ age/skill) climbs; the full 6–12 range is top-band.
  const factorSets = [
    [2, 5, 10], [2, 3, 5, 10], [2, 3, 4, 5, 10], [2, 3, 4, 5, 6, 10],
    [3, 4, 5, 6, 7, 10], [4, 5, 6, 7, 8], [6, 7, 8, 9], [6, 7, 8, 9, 11],
    [7, 8, 9, 11, 12], [8, 9, 11, 12], [9, 11, 12], [11, 12],
  ];
  // Multiplier ceiling grows with the band. Early bands lean on the easy
  // skip-counting tables (2, 5, 10) so there is enough variety to fill a full
  // 20-question stage without resorting to hard products.
  const hiByBand = [10, 10, 10, 12, 12, 12, 12, 12, 13, 13, 15, 15];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const factors = factorSets[band - 1];
    const hi = hiByBand[band - 1];
    // Division is the inverse of a table you already know — hold it back until
    // the early tables are established (≈ age 8), rather than mixing it in at
    // the very first stage.
    const allowDiv = band >= 4;
    out.push(
      ...fillBand(() => {
        const a = pick(rng, factors);
        const b = randInt(rng, 2, hi);
        if (!allowDiv || rng() < 0.7) {
          const { options, answer } = mcq(rng, a * b, [a, -a, b, -b, 1, -1, 2 * a]);
          return { id: '', band, type: 'expr', ...k('multiply', 'mul'), expr: `${a} × ${b}`, options, answer };
        }
        const { options, answer } = mcq(rng, b, [1, -1, 2, -2, a > 3 ? 3 : 4]);
        return { id: '', band, type: 'expr', ...k('multiply', 'div'), expr: `${a * b} ÷ ${a}`, options, answer };
      }),
    );
  }
  return out;
}

const FRAC = new Map<number, string>([
  [2, '½'], [3, '⅓'], [4, '¼'], [5, '⅕'], [6, '⅙'], [8, '⅛'],
]);

function genFractions(rng: Rng): Question[] {
  // "A fraction of a quantity" is really age-7+ content, so start with the
  // friendliest fraction (a half) and only widen the denominator pool as the
  // band climbs. Halves and quarters dominate the early stages; fifths/sixths/
  // eighths arrive later.
  const denomSets = [
    [2, 3, 4], [2, 3, 4], [2, 3, 4, 5], [2, 3, 4, 5], [2, 3, 4, 5, 6], [2, 3, 4, 5, 6],
    [3, 4, 5, 6], [3, 4, 5, 6, 8], [3, 4, 5, 6, 8], [4, 5, 6, 8], [4, 5, 6, 8], [4, 5, 6, 8],
  ];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const denoms = denomSets[band - 1];
    out.push(
      ...fillBand(() => {
        if (rng() < 0.75) {
          const d = pick(rng, denoms);
          // The answer is `mult`, so keep it small early (½ of 4 … ¼ of 32, all
          // answering ≤ 8) and let the wholes grow gently with the band.
          const mult = randInt(rng, 2, 7 + band);
          const n = d * mult; // divisible → whole answer
          const ans = n / d;
          const { options, answer } = mcq(rng, ans, [1, -1, 2, -2, d, mult + 1]);
          return { id: '', band, type: 'expr', ...k('fractions', 'of'), expr: `${FRAC.get(d)} of ${n}`, options, answer };
        }
        // Compare two unit fractions — the bigger one has the smaller denominator.
        const sorted = [...denoms].sort((a, b) => a - b);
        const d1 = pick(rng, sorted);
        const d2 = pick(rng, sorted.filter((d) => d !== d1)) ?? sorted[(sorted.indexOf(d1) + 1) % sorted.length];
        const bigger = FRAC.get(Math.min(d1, d2))!;
        const other = FRAC.get(Math.max(d1, d2))!;
        const { options, answer } = mcqStr(rng, bigger, [other]);
        return { id: '', band, type: 'expr', ...k('fractions', 'compare'), expr: `${FRAC.get(d1)}   vs   ${FRAC.get(d2)}`, options, answer };
      }),
    );
  }
  return out;
}

// Curated shape pool: glyph + side count. Bands introduce more-sided shapes.
// Glyphs are limited to widely-supported Unicode so they render on every device.
const SHAPES: { glyph: string; sides: number }[] = [
  { glyph: '▲', sides: 3 },
  { glyph: '◼', sides: 4 },
  { glyph: '▬', sides: 4 }, // rectangle
  { glyph: '◆', sides: 4 }, // rhombus
  { glyph: '⬟', sides: 5 },
  { glyph: '⬡', sides: 6 },
];

function genShapes(rng: Rng): Question[] {
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    // Difficulty = how many sides are in play (low bands: 3–4, high bands: up to 6).
    const cap = Math.min(3 + band, 6);
    const pool = SHAPES.filter((s) => s.sides <= cap);
    out.push(
      ...fillBand(() => {
        const s = pick(rng, pool);
        const roll = rng();
        // "Total sides across a group" is sides × count — hidden multiplication,
        // so only offer it once the child is old enough to multiply (band ≥ 4).
        // Younger bands stay on naming and counting shapes.
        const allowTotalSides = band >= 4;
        if (roll < 0.25 || (!allowTotalSides && roll < 0.5)) {
          // Name the property of a single shape (sides === corners).
          const variant = pick(rng, ['sides', 'corners'] as const);
          const { options, answer } = mcq(rng, s.sides, [1, -1, 2, -2]);
          return { id: '', band, type: 'expr', ...k('shapes', variant), expr: s.glyph, options, answer };
        }
        if (!allowTotalSides || roll < 0.65) {
          // Count a row of identical shapes.
          const n = randInt(rng, 2, 6 + band);
          const expr = Array.from({ length: n }, () => s.glyph).join(' ');
          const { options, answer } = mcq(rng, n, [1, -1, 2, -2, 3]);
          return { id: '', band, type: 'expr', ...k('shapes', 'count'), expr, options, answer };
        }
        // Total sides across a group of shapes (sides × count — a stretch goal).
        const n = randInt(rng, 2, 4 + band);
        const expr = Array.from({ length: n }, () => s.glyph).join(' ');
        const { options, answer } = mcq(rng, n * s.sides, [s.sides, -s.sides, 1, -1, n]);
        return { id: '', band, type: 'expr', ...k('shapes', 'totalSides'), expr, options, answer };
      }),
    );
  }
  return out;
}

function genTimeMoney(rng: Rng): Question[] {
  const out: Question[] = [];
  const clocks: { glyph: string; mins: number }[] = [
    { glyph: '🕛', mins: 0 }, { glyph: '🕧', mins: 30 }, { glyph: '🕐', mins: 0 }, { glyph: '🕜', mins: 30 },
  ];
  for (let band = 1; band <= BANDS; band++) {
    out.push(
      ...fillBand(() => {
        const roll = rng();
        if (roll < 0.4) {
          // Sum a handful of coins, growing in count and value with the band.
          const coins = 2 + Math.min(4, Math.floor(band / 2));
          const values: number[] = [];
          for (let c = 0; c < coins; c++) values.push(pick(rng, band <= 4 ? [1, 2, 5] : [5, 10, 20, 25, 50]));
          const sum = values.reduce((a, b) => a + b, 0);
          const { options, answer } = mcq(rng, sum, [5, -5, 10, -10, 1, -1]);
          return {
            id: '', band, type: 'expr', ...k('timemoney', 'money'),
            expr: values.map((v) => `${v}¢`).join(' + '),
            options: options.map((o) => `${o}¢`), answer,
          };
        }
        if (roll < 0.8) {
          // Two-purse addition — amounts scale with the band.
          const a = randInt(rng, 1, 10 * band);
          const b = randInt(rng, 1, 10 * band);
          const { options, answer } = mcq(rng, a + b, [5, -5, 10, -10, 1, -1]);
          return { id: '', band, type: 'expr', ...k('timemoney', 'money'), expr: `${a}¢ + ${b}¢`, options: options.map((o) => `${o}¢`), answer };
        }
        // Time facts.
        if (band <= 4) {
          const { options, answer } = mcq(rng, 60, [30, -15, 40, -48, 12]);
          return { id: '', band, type: 'expr', ...k('timemoney', 'time'), expr: '1 h = ▢ min', options, answer };
        }
        const c = pick(rng, clocks);
        const correct = c.mins === 0 ? "o'clock" : 'half past';
        const { options, answer } = mcqStr(rng, correct, ['quarter past', 'quarter to']);
        return { id: '', band, type: 'expr', ...k('timemoney', 'time'), expr: c.glyph, options, answer };
      }),
    );
  }
  return out;
}

function genPatterns(rng: Rng): Question[] {
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    out.push(
      ...fillBand(() => {
        const modes: Array<'arith' | 'geo' | 'tri'> = ['arith'];
        if (band >= 3) modes.push('geo');
        if (band >= 5) modes.push('tri');
        const mode = pick(rng, modes);
        if (mode === 'geo') {
          const ratio = band >= 7 ? 3 : 2;
          const start = randInt(rng, 1, 4);
          const seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
          const answer = start * ratio ** 4;
          const { options, answer: ai } = mcq(rng, answer, [start * ratio ** 3, ratio, -ratio, answer + start]);
          return { id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai };
        }
        if (mode === 'tri') {
          const start = randInt(rng, 1, 4);
          const s0 = randInt(rng, 1, 3);
          const t2 = start + s0;
          const t3 = t2 + (s0 + 1);
          const t4 = t3 + (s0 + 2);
          const answer = t4 + (s0 + 3);
          const seq = [start, t2, t3, t4];
          const { options, answer: ai } = mcq(rng, answer, [1, -1, 2, -2, s0 + 3]);
          return { id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai };
        }
        // Arithmetic run — steeper steps and larger starts than before.
        const step = randInt(rng, 1, 2 + band);
        const start = randInt(rng, 1, 15 + band * 2);
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        const answer = start + 4 * step;
        const { options, answer: ai } = mcq(rng, answer, [step, -step, 1, -1, 2 * step]);
        return { id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai };
      }),
    );
  }
  return out;
}

const LOGIC_GLYPHS = ['🔺', '🟦', '🟢', '⭐', '🟣', '🟠'];

function genLogic(rng: Rng): Question[] {
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    out.push(
      ...fillBand(() => {
        const roll = rng();
        if (roll < 0.6) {
          // Repeating AB / ABC cycle — continue it.
          const period = band >= 6 ? 3 : 2;
          const base = shuffle(rng, LOGIC_GLYPHS).slice(0, period);
          const seq = Array.from({ length: 4 }, (_, i) => base[i % period]);
          const answer = base[4 % period];
          const distract = LOGIC_GLYPHS.filter((g) => g !== answer);
          const { options, answer: ai } = mcqStr(rng, answer, shuffle(rng, distract).slice(0, 3));
          return { id: '', band, type: 'seq', ...k('logic', 'next'), seq, options, answer: ai };
        }
        if (roll < 0.8) {
          // Odd-one-out: three multiples of `base`, one that breaks the rule.
          const base = randInt(rng, 2, 3 + band * 2);
          const same = [base * 2, base * 3, base * 4];
          const odd = base * 3 + 1;
          const { options, answer } = mcqStr(rng, String(odd), same.map(String));
          return { id: '', band, type: 'expr', ...k('logic', 'odd'), expr: '', options, answer };
        }
        // Symbol equation: 🐝 = v → 🐝 + 🐝
        const v = randInt(rng, 2, 3 + band);
        const { options, answer } = mcq(rng, v * 2, [1, -1, 2, -2, v]);
        return { id: '', band, type: 'expr', ...k('logic', 'value'), expr: `🐝=${v} · 🐝+🐝`, options, answer };
      }),
    );
  }
  return out;
}

const GENERATORS: Record<(typeof TOPICS)[number], (rng: Rng) => Question[]> = {
  counting: genCounting,
  addsub: genAddSub,
  multiply: genMultiply,
  fractions: genFractions,
  shapes: genShapes,
  timemoney: genTimeMoney,
  patterns: genPatterns,
  logic: genLogic,
};

// ---------------------------------------------------------------------------
// Bee Olympiad: harder, competition-style puzzles split by track.
// ---------------------------------------------------------------------------
function genOlympiad(rng: Rng): Question[] {
  const out: Question[] = [];
  // Kangaroo — visual sequences & pattern reasoning.
  for (let i = 0; i < 12; i++) {
    const ratio = i % 3 === 0 ? 4 : i % 2 === 0 ? 2 : 3;
    const start = randInt(rng, 1, 5);
    const seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
    const answer = start * ratio ** 4;
    const { options, answer: ai } = mcq(rng, answer, [start * ratio ** 3, ratio, answer + start, -ratio]);
    out.push({ id: '', band: 1, track: 'kangaroo', type: 'seq', ...k('olympiad', 'next'), seq: seq.map(String), options, answer: ai });
  }
  // SASMO — logic & reasoning with symbol equations.
  for (let i = 0; i < 12; i++) {
    const v = randInt(rng, 3, 12);
    const mult = randInt(rng, 3, 6);
    const { options, answer } = mcq(rng, v * mult, [v, -v, mult, 1, -1, 2 * v]);
    out.push({ id: '', band: 1, track: 'sasmo', type: 'expr', ...k('olympiad', 'logic'), expr: `🐝=${v} · 🐝×${mult}`, options, answer });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Emit.
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../src/math/data/banks');
mkdirSync(OUT_DIR, { recursive: true });

function stamp(topic: string, qs: Question[]): Question[] {
  return qs.map((q, i) => ({ ...q, id: `${q.track ?? topic}-b${q.band}-${i}` }));
}

let grandTotal = 0;
const summary: string[] = [];
for (const topic of TOPICS) {
  const rng = mulberry32(hashSeed(topic));
  const qs = stamp(topic, GENERATORS[topic](rng));
  writeFileSync(resolve(OUT_DIR, `${topic}.json`), JSON.stringify(qs, null, 2) + '\n');
  grandTotal += qs.length;
  const perBand = Array.from({ length: BANDS }, (_, b) => qs.filter((q) => q.band === b + 1).length);
  summary.push(`  ${topic.padEnd(10)} ${String(qs.length).padStart(4)}  bands[${perBand.join(',')}]`);
}
{
  const rng = mulberry32(hashSeed('olympiad'));
  const qs = stamp('olympiad', genOlympiad(rng));
  writeFileSync(resolve(OUT_DIR, 'olympiad.json'), JSON.stringify(qs, null, 2) + '\n');
  grandTotal += qs.length;
  const k1 = qs.filter((q) => q.track === 'kangaroo').length;
  const k2 = qs.filter((q) => q.track === 'sasmo').length;
  summary.push(`  ${'olympiad'.padEnd(10)} ${String(qs.length).padStart(4)}  kangaroo[${k1}] sasmo[${k2}]`);
}

/** Stable per-topic seed so each bank is independent yet reproducible. */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

console.log(`Math banks written to ${OUT_DIR}`);
console.log(summary.join('\n'));
console.log(`  ${'TOTAL'.padEnd(10)} ${String(grandTotal).padStart(4)} questions`);
