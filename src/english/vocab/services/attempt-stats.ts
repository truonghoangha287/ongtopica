/**
 * Lightweight, per-word attempt statistics for the Unscramble activity.
 *
 * Kept separate from the spaced-repetition progression (`wordProgress`) on
 * purpose: these are raw gameplay counters (wrong tile taps, completions) used
 * for the parent dashboard, NOT signals that should move a word's stage. Stored
 * in localStorage so they survive reloads without a Dexie migration.
 */

const KEY = 'ongtopica:unscramble-stats';

export interface AttemptStat {
  completions: number;
  wrongTaps: number;
}

export type AttemptStats = Record<string, AttemptStat>;

function readAll(): AttemptStats {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AttemptStats) : {};
  } catch {
    return {};
  }
}

function writeAll(stats: AttemptStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    /* storage full / unavailable — stats are best-effort */
  }
}

/** Namespace a stat by profile so siblings on one device don't collide. */
function key(childId: string | null, wordId: string): string {
  return `${childId ?? 'anon'}:${wordId}`;
}

export function recordWrongTap(childId: string | null, wordId: string): void {
  const all = readAll();
  const k = key(childId, wordId);
  const cur = all[k] ?? { completions: 0, wrongTaps: 0 };
  all[k] = { ...cur, wrongTaps: cur.wrongTaps + 1 };
  writeAll(all);
}

export function recordCompletion(childId: string | null, wordId: string): void {
  const all = readAll();
  const k = key(childId, wordId);
  const cur = all[k] ?? { completions: 0, wrongTaps: 0 };
  all[k] = { ...cur, completions: cur.completions + 1 };
  writeAll(all);
}

export function getStat(childId: string | null, wordId: string): AttemptStat {
  return readAll()[key(childId, wordId)] ?? { completions: 0, wrongTaps: 0 };
}
