/**
 * Math World question-bank generator.
 *
 * Produces the large, deterministic quiz banks the Skills Hive and Bee Olympiad
 * consume. Output is written to `src/math/data/banks/*.json` — one file per
 * topic plus `olympiad.json`. These files are GENERATED: do not hand-edit them;
 * change the band specs below and re-run.
 *
 *   pnpm exec tsx scripts/generate-math-data.ts
 *
 * Design notes
 * ------------
 * - Twelve difficulty BANDS per topic map 1:1 onto the twelve journey levels
 *   (`TOPIC_LEVEL_COUNT`). A child at level N plays band N (clamped 1..12), so
 *   the questions genuinely get harder as they climb — no more fixed samples.
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

/** De-dupe questions that render identically (same expr/seq + answer). */
function dedupe(qs: Question[]): Question[] {
  const seen = new Set<string>();
  return qs.filter((q) => {
    const key = `${q.type}|${q.expr ?? ''}|${(q.seq ?? []).join(',')}|${q.options[q.answer]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Per-topic band generators. Each returns questions across all 12 bands.
// ---------------------------------------------------------------------------

function genCounting(rng: Rng): Question[] {
  const steps = [1, 1, 1, 2, 2, 5, 5, 10, 10, 25, 50, 100];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const step = steps[band - 1];
    const local: Question[] = [];
    for (let i = 0; i < 4; i++) {
      const start = randInt(rng, 1, 6) * step + randInt(rng, 0, band) * step;
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      const answer = start + 4 * step;
      const { options, answer: ai } = mcq(rng, answer, [step, -step, 2 * step, 1, -1, step + 1]);
      local.push({ id: '', band, type: 'seq', ...k('counting', 'next'), seq: seq.map(String), options, answer: ai });
    }
    // one "what comes after" (always +1, useful reinforcement)
    const n = randInt(rng, 5 * band, 12 * band + 9);
    const after = mcq(rng, n + 1, [1, -1, 2, -2, 10, -10]);
    local.push({ id: '', band, type: 'expr', ...k('counting', 'after'), expr: `${n} → ▢`, options: after.options, answer: after.answer });
    out.push(...dedupe(local));
  }
  return out;
}

function genAddSub(rng: Rng): Question[] {
  const sumMax = [8, 10, 12, 15, 18, 20, 25, 30, 40, 50, 70, 99];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const max = sumMax[band - 1];
    const local: Question[] = [];
    // two additions
    for (let i = 0; i < 2; i++) {
      const a = randInt(rng, Math.max(1, Math.floor(max / 4)), max - 1);
      const b = randInt(rng, 1, max - a);
      const sum = a + b;
      const { options, answer } = mcq(rng, sum, [1, -1, 2, -2, 10, -10, 3]);
      local.push({ id: '', band, type: 'expr', ...k('addsub', 'add'), expr: `${a} + ${b}`, options, answer });
    }
    // one subtraction
    {
      const c = randInt(rng, Math.max(3, Math.floor(max / 2)), max);
      const b = randInt(rng, 1, c - 1);
      const { options, answer } = mcq(rng, c - b, [1, -1, 2, -2, 3, -3]);
      local.push({ id: '', band, type: 'expr', ...k('addsub', 'sub'), expr: `${c} − ${b}`, options, answer });
    }
    // one missing addend
    {
      const c = randInt(rng, Math.max(4, Math.floor(max / 2)), max);
      const a = randInt(rng, 1, c - 1);
      const { options, answer } = mcq(rng, c - a, [1, -1, 2, -2, 3]);
      local.push({ id: '', band, type: 'expr', ...k('addsub', 'missing'), expr: `${a} + ▢ = ${c}`, options, answer });
    }
    out.push(...dedupe(local));
  }
  return out;
}

function genMultiply(rng: Rng): Question[] {
  // Which times-tables are "in play" as bands climb.
  const factorSets = [
    [2, 5], [2, 5, 10], [2, 3, 5, 10], [2, 3, 4, 5, 10],
    [2, 3, 4, 5, 6, 10], [2, 3, 4, 5, 6, 7], [3, 4, 6, 7, 8], [4, 6, 7, 8, 9],
    [6, 7, 8, 9], [6, 7, 8, 9, 11], [7, 8, 9, 11, 12], [8, 9, 11, 12],
  ];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const factors = factorSets[band - 1];
    const local: Question[] = [];
    for (let i = 0; i < 3; i++) {
      const a = pick(rng, factors);
      const b = randInt(rng, 2, band <= 3 ? 5 : 12);
      const prod = a * b;
      const { options, answer } = mcq(rng, prod, [a, -a, b, -b, 1, -1, 2 * a]);
      local.push({ id: '', band, type: 'expr', ...k('multiply', 'mul'), expr: `${a} × ${b}`, options, answer });
    }
    {
      const a = pick(rng, factors);
      const b = randInt(rng, 2, band <= 3 ? 5 : 10);
      const prod = a * b;
      const { options, answer } = mcq(rng, b, [1, -1, 2, -2, a > 3 ? 3 : 4]);
      local.push({ id: '', band, type: 'expr', ...k('multiply', 'div'), expr: `${prod} ÷ ${a}`, options, answer });
    }
    out.push(...dedupe(local));
  }
  return out;
}

const FRAC = new Map<number, string>([
  [2, '½'], [3, '⅓'], [4, '¼'], [5, '⅕'], [6, '⅙'], [8, '⅛'],
]);

function genFractions(rng: Rng): Question[] {
  const denomSets = [
    [2], [2, 4], [2, 4], [2, 3, 4], [2, 3, 4], [2, 3, 4, 5],
    [2, 3, 4, 5], [2, 3, 4, 5, 6], [3, 4, 5, 6], [3, 4, 5, 6, 8],
    [4, 5, 6, 8], [4, 5, 6, 8],
  ];
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const denoms = denomSets[band - 1];
    const local: Question[] = [];
    for (let i = 0; i < 3; i++) {
      const d = pick(rng, denoms);
      const mult = randInt(rng, 2, 2 + band);
      const n = d * mult; // divisible → whole answer
      const ans = n / d;
      const { options, answer } = mcq(rng, ans, [1, -1, 2, -2, d, ans]);
      local.push({ id: '', band, type: 'expr', ...k('fractions', 'of'), expr: `${FRAC.get(d)} of ${n}`, options, answer });
    }
    // one compare (which unit fraction is bigger → smaller denominator)
    {
      const sorted = [...denoms].sort((a, b) => a - b);
      const d1 = sorted[0];
      const d2 = pick(rng, sorted.filter((d) => d !== d1)) ?? sorted[1] ?? d1 + 2;
      const bigger = FRAC.get(Math.min(d1, d2))!;
      const other = FRAC.get(Math.max(d1, d2))!;
      const { options, answer } = mcqStr(rng, bigger, [other]);
      local.push({ id: '', band, type: 'expr', ...k('fractions', 'compare'), expr: `${FRAC.get(d1)}   vs   ${FRAC.get(d2)}`, options, answer });
    }
    out.push(...dedupe(local));
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
    const local: Question[] = [];
    const variants: Array<'sides' | 'corners' | 'equalSides'> = ['sides', 'corners', 'equalSides'];
    for (const variant of variants) {
      const s = pick(rng, pool);
      // corners === sides; equalSides only for regular shapes (all our glyphs are regular-ish).
      const { options, answer } = mcq(rng, s.sides, [1, -1, 2, -2]);
      local.push({ id: '', band, type: 'expr', ...k('shapes', variant), expr: s.glyph, options, answer });
    }
    out.push(...dedupe(local));
  }
  return out;
}

function genTimeMoney(rng: Rng): Question[] {
  const out: Question[] = [];
  const clocks: { glyph: string; mins: number }[] = [
    { glyph: '🕛', mins: 0 }, { glyph: '🕧', mins: 30 }, { glyph: '🕐', mins: 0 }, { glyph: '🕜', mins: 30 },
  ];
  for (let band = 1; band <= BANDS; band++) {
    const local: Question[] = [];
    // money: sum of small coin values, growing with band
    for (let i = 0; i < 2; i++) {
      const coins = 2 + Math.min(3, Math.floor(band / 3));
      const values: number[] = [];
      for (let c = 0; c < coins; c++) values.push(pick(rng, band <= 4 ? [1, 2, 5] : [5, 10, 20, 25]));
      const sum = values.reduce((a, b) => a + b, 0);
      const { options, answer } = mcq(rng, sum, [5, -5, 10, -10, 1, -1]);
      local.push({
        id: '', band, type: 'expr', ...k('timemoney', 'money'),
        expr: values.map((v) => `${v}¢`).join(' + '),
        options: options.map((o) => `${o}¢`), answer,
      });
    }
    // time facts
    if (band <= 4) {
      const { options, answer } = mcq(rng, 60, [30, -15, 40, -48, 12]);
      local.push({ id: '', band, type: 'expr', ...k('timemoney', 'time'), expr: '1 h = ▢ min', options, answer });
    } else {
      const c = pick(rng, clocks);
      const correct = c.mins === 0 ? "o'clock" : 'half past';
      const { options, answer } = mcqStr(rng, correct, ['quarter past', 'quarter to']);
      local.push({ id: '', band, type: 'expr', ...k('timemoney', 'time'), expr: c.glyph, options, answer });
    }
    // extra money for volume
    {
      const a = randInt(rng, 1, 5 * band);
      const b = randInt(rng, 1, 5 * band);
      const { options, answer } = mcq(rng, a + b, [5, -5, 10, -10, 1]);
      local.push({ id: '', band, type: 'expr', ...k('timemoney', 'money'), expr: `${a}¢ + ${b}¢`, options: options.map((o) => `${o}¢`), answer });
    }
    out.push(...dedupe(local));
  }
  return out;
}

function genPatterns(rng: Rng): Question[] {
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const local: Question[] = [];
    // arithmetic
    for (let i = 0; i < 2; i++) {
      const step = randInt(rng, 1, 1 + band);
      const start = randInt(rng, 1, 5 + band);
      const seq = [start, start + step, start + 2 * step, start + 3 * step];
      const answer = start + 4 * step;
      const { options, answer: ai } = mcq(rng, answer, [step, -step, 1, -1, 2 * step]);
      local.push({ id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai });
    }
    // geometric (doubling / tripling) — mid+ bands
    if (band >= 3) {
      const ratio = band >= 7 ? 3 : 2;
      const start = randInt(rng, 1, 3);
      const seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
      const answer = start * ratio ** 4;
      const { options, answer: ai } = mcq(rng, answer, [start * ratio ** 3, ratio, -ratio, answer + start]);
      local.push({ id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai });
    }
    // increasing-step (triangular-ish) — harder bands
    if (band >= 5) {
      const start = randInt(rng, 1, 3);
      const s0 = randInt(rng, 1, 2);
      const t2 = start + s0;
      const t3 = t2 + (s0 + 1);
      const t4 = t3 + (s0 + 2);
      const answer = t4 + (s0 + 3);
      const seq = [start, t2, t3, t4];
      const { options, answer: ai } = mcq(rng, answer, [1, -1, 2, -2, s0 + 3]);
      local.push({ id: '', band, type: 'seq', ...k('patterns', 'next'), seq: seq.map(String), options, answer: ai });
    }
    out.push(...dedupe(local));
  }
  return out;
}

const LOGIC_GLYPHS = ['🔺', '🟦', '🟢', '⭐', '🟣', '🟠'];

function genLogic(rng: Rng): Question[] {
  const out: Question[] = [];
  for (let band = 1; band <= BANDS; band++) {
    const local: Question[] = [];
    // repeating AB / ABC patterns
    {
      const glyphs = shuffle(rng, LOGIC_GLYPHS).slice(0, band >= 6 ? 3 : 2);
      const seq = [glyphs[0], glyphs[1 % glyphs.length], glyphs[2 % glyphs.length], glyphs[0]].slice(0, 4);
      // continue the AB(C) cycle
      const nextIdx = 4 % glyphs.length;
      const answer = glyphs[nextIdx];
      const distract = LOGIC_GLYPHS.filter((g) => g !== answer);
      const { options, answer: ai } = mcqStr(rng, answer, shuffle(rng, distract).slice(0, 3));
      local.push({ id: '', band, type: 'seq', ...k('logic', 'next'), seq, options, answer: ai });
    }
    // odd-one-out (numbers): three share a property, one breaks it
    {
      const base = randInt(rng, 2, 3 + band);
      const same = [base * 2, base * 3, base * 4];
      const odd = base * 3 + 1; // not a multiple of base
      const { options, answer } = mcqStr(rng, String(odd), same.map(String));
      // No expr card: the four options ARE the set — the child picks the one that breaks the rule.
      local.push({ id: '', band, type: 'expr', ...k('logic', 'odd'), expr: '', options, answer });
    }
    // symbol equation: 🐝 = v → 🐝 + 🐝
    {
      const v = randInt(rng, 2, 2 + Math.floor(band / 2));
      const { options, answer } = mcq(rng, v * 2, [1, -1, 2, -2, v]);
      local.push({ id: '', band, type: 'expr', ...k('logic', 'value'), expr: `🐝=${v} · 🐝+🐝`, options, answer });
    }
    out.push(...dedupe(local));
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
    const ratio = i % 2 === 0 ? 2 : 3;
    const start = randInt(rng, 1, 4);
    const seq = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
    const answer = start * ratio ** 4;
    const { options, answer: ai } = mcq(rng, answer, [start * ratio ** 3, ratio, answer + start, -ratio]);
    out.push({ id: '', band: 1, track: 'kangaroo', type: 'seq', ...k('olympiad', 'next'), seq: seq.map(String), options, answer: ai });
  }
  // SASMO — logic & reasoning with symbol equations.
  for (let i = 0; i < 12; i++) {
    const v = randInt(rng, 2, 9);
    const mult = randInt(rng, 2, 4);
    const { options, answer } = mcq(rng, v * mult, [v, -v, mult, 1, -1]);
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
  summary.push(`  ${topic.padEnd(10)} ${String(qs.length).padStart(3)}  bands[${perBand.join(',')}]`);
}
{
  const rng = mulberry32(hashSeed('olympiad'));
  const qs = stamp('olympiad', genOlympiad(rng));
  writeFileSync(resolve(OUT_DIR, 'olympiad.json'), JSON.stringify(qs, null, 2) + '\n');
  grandTotal += qs.length;
  const k1 = qs.filter((q) => q.track === 'kangaroo').length;
  const k2 = qs.filter((q) => q.track === 'sasmo').length;
  summary.push(`  ${'olympiad'.padEnd(10)} ${String(qs.length).padStart(3)}  kangaroo[${k1}] sasmo[${k2}]`);
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
console.log(`  ${'TOTAL'.padEnd(10)} ${String(grandTotal).padStart(3)} questions`);
