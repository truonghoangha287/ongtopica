/**
 * Tiny Web Audio sound effects for game feedback. Synthesised (no asset files),
 * so they work offline and add nothing to the bundle. Honours the same
 * `audioEnabled` localStorage flag as spoken-word audio, and degrades silently
 * where Web Audio is unavailable (e.g. jsdom in tests).
 */

let ctx: AudioContext | null = null;

function audioEnabled(): boolean {
  try {
    return localStorage.getItem('audioEnabled') !== 'false';
  } catch {
    return true;
  }
}

function getContext(): AudioContext | null {
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  /** start offset in seconds, for simple two-note arpeggios */
  at?: number;
  gain?: number;
}

function playTones(tones: Tone[]): void {
  if (!audioEnabled()) return;
  const context = getContext();
  if (!context) return;
  if (context.state === 'suspended') void context.resume();
  const now = context.currentTime;
  for (const t of tones) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.value = t.freq;
    const start = now + (t.at ?? 0);
    const peak = t.gain ?? 0.08;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + t.duration + 0.02);
  }
}

/** Soft upward "pop" — a letter snapped into place. */
export const playPop = (): void => playTones([{ freq: 660, duration: 0.12, type: 'triangle' }]);

/** Gentle low "uh-uh" buzz — a wrong tile (no penalty, just feedback). */
export const playBuzz = (): void =>
  playTones([{ freq: 180, duration: 0.16, type: 'sawtooth', gain: 0.05 }]);

/** Descending "crumble" — placed letters shatter and the puzzle starts over. */
export const playBreak = (): void =>
  playTones([
    { freq: 320, duration: 0.14, type: 'square', gain: 0.05 },
    { freq: 200, duration: 0.16, type: 'square', gain: 0.05, at: 0.08 },
    { freq: 120, duration: 0.2, type: 'square', gain: 0.05, at: 0.16 },
  ]);

/** Bright two-note chime — the word was completed. */
export const playWin = (): void =>
  playTones([
    { freq: 660, duration: 0.16, type: 'triangle' },
    { freq: 990, duration: 0.22, type: 'triangle', at: 0.12 },
  ]);
