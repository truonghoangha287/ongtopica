import { Howler } from 'howler';

let armed = false;

/**
 * Resume the WebAudio context on the first real user gesture so the very first
 * Listen & Learn card actually plays instead of silently failing the browser
 * autoplay policy. Safe no-op when Howler / WebAudio is unavailable; never throws.
 */
export function armAudioUnlock(): void {
  if (armed) return;
  armed = true;
  const resume = () => {
    try {
      const ctx = Howler.ctx;
      if (ctx && ctx.state !== 'running') void ctx.resume();
    } catch {
      /* ignore — audio just stays tap-to-play */
    }
  };
  for (const evt of ['pointerdown', 'touchstart', 'keydown'] as const) {
    window.addEventListener(evt, resume, { capture: true, passive: true });
  }
}
