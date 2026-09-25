import type { FindXOption } from '@/math/types/find-x.types';

/**
 * Shaping the list of options a step offers, once its contents are decided.
 * A leaf module: it knows nothing about problems or algebra, so every builder in
 * `find-x-step-builders` (and the operands builder's computed distractors) can
 * use it without any of them importing each other.
 */

/**
 * Rotate the options by a hash of the problem and step, so the right answer is
 * not always in the same slot. Deterministic — the same problem always renders
 * the same way, which is what lets a test assert on it.
 */
export function order(options: FindXOption[], seed: string): FindXOption[] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const shift = Math.abs(h) % options.length;
  return [...options.slice(shift), ...options.slice(0, shift)];
}

/** Drop options whose visible label repeats one already kept. */
export function dedupe(options: FindXOption[]): FindXOption[] {
  const seen = new Set<string>();
  return options.filter((o) => {
    const key = o.labelKey ?? o.label ?? '';
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
