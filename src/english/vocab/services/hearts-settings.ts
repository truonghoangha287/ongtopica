import { HEARTS_CHOICES } from '@/shared/constants/game-constants';

/**
 * The optional hearts (lives) setting. This module is the only place that
 * touches `localStorage.heartsMode`, so every failure mode — unset key, corrupt
 * value, private browsing — degrades to "off", i.e. the game we shipped before.
 */

/** A heart count a grown-up can pick: 3 or 5. */
export type HeartsChoice = (typeof HEARTS_CHOICES)[number];
/** What is stored: "off" | "3" | "5". */
export type HeartsMode = 'off' | `${HeartsChoice}`;
/** Hearts a session starts with. 0 means hearts are off. */
export type HeartsCount = 0 | HeartsChoice;

const STORAGE_KEY = 'heartsMode';
const VALID_COUNTS: readonly string[] = HEARTS_CHOICES.map(String);

export function readHeartsMode(): HeartsMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null && VALID_COUNTS.includes(raw)) return raw as HeartsMode;
  } catch {
    // Private browsing can throw on read — fall through to "off".
  }
  return 'off';
}

export function writeHeartsMode(mode: HeartsMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Nothing to do: hearts are optional, and the caller keeps the value in
    // component state for this session.
  }
}

export function heartsCountFor(mode: HeartsMode): HeartsCount {
  return mode === 'off' ? 0 : (Number(mode) as HeartsChoice);
}
