/**
 * Seeded random number generation for the data generators.
 *
 * Every generator must produce byte-identical output on every run, so nothing
 * under `scripts/` may call `Math.random()`. Seeding per item rather than per
 * run is what keeps output stable under edits: a word's letter puzzle is
 * derived from that word's own id, so adding a word never reshuffles its
 * neighbours' puzzles and the diff stays honest.
 *
 * Extracted from `generate-math-data.ts`, which used the same pair privately.
 */

export type Rng = () => number;

/** Small, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: turns a stable string key (a topic, a word id) into a seed. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** An RNG seeded from a string key. */
export const rngFor = (key: string): Rng => mulberry32(hashSeed(key));

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
