/**
 * On-device speech narration via the Web Speech API.
 *
 * Used by the Math subject so number/shape/operation prompts can be spoken aloud
 * without shipping audio assets — works fully offline (Constitution V) and adds
 * nothing to the bundle. Honours the same `audioEnabled` flag as spoken-word
 * audio (parent-controlled, Constitution VAD), and degrades silently where
 * speechSynthesis is unavailable (e.g. jsdom in tests, locked-down browsers).
 *
 * The visual prompt + caption always conveys the question, so speech is purely
 * an enhancement — never the only channel (Constitution II — no audio-only).
 */

function audioEnabled(): boolean {
  try {
    return localStorage.getItem('audioEnabled') !== 'false';
  } catch {
    return true;
  }
}

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

export function isSpeechSupported(): boolean {
  return synth() != null && typeof window !== 'undefined' && 'SpeechSynthesisUtterance' in window;
}

/** Speak the given text. No-op when muted, unsupported, or text is empty. */
export function speak(text: string): void {
  if (!text || !audioEnabled() || !isSpeechSupported()) return;
  const s = synth();
  if (!s) return;
  try {
    s.cancel(); // stop any in-flight utterance so prompts don't overlap
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9; // a touch slower for young listeners
    utter.pitch = 1.05;
    s.speak(utter);
  } catch {
    // Some environments throw on construction/speak — fail silently.
  }
}

/** Stop any current narration. */
export function stopSpeaking(): void {
  try {
    synth()?.cancel();
  } catch {
    /* no-op */
  }
}
