// Persistent "unlock everything" config flag.
// When enabled, every progression gate (activity stages, Listen & Match,
// Memory Match, and the Movers/Flyers level tabs) is treated as unlocked.
// Stored in localStorage so it survives reloads, mirroring `audioEnabled`.

const UNLOCK_ALL_KEY = 'unlockAll';

export function isUnlockAll(): boolean {
  return localStorage.getItem(UNLOCK_ALL_KEY) === 'true';
}

export function setUnlockAll(enabled: boolean): void {
  localStorage.setItem(UNLOCK_ALL_KEY, String(enabled));
}
