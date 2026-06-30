/**
 * Best-effort text-to-speech so pre-readers get an audible cue for UI labels
 * (locked hints, category names). No-op when SpeechSynthesis is unavailable or
 * sound is switched off in Settings. Never throws.
 */
export function speak(text: string): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (localStorage.getItem('audioEnabled') === 'false') return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1.15;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    /* ignore — speech is an enhancement, not a requirement */
  }
}
