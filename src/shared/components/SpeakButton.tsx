import { speak } from '@/shared/utils/speech';

interface SpeakButtonProps {
  /** Text to narrate when tapped. */
  text: string;
  /** Accessible label for the button (e.g. "Hear it again"). */
  label: string;
}

/**
 * Replay-narration button. Mirrors the look of the vocab AudioPlayer's play
 * control so the two subjects feel consistent. The on-screen prompt always
 * carries the question visually, so this button is an enhancement only.
 */
export function SpeakButton({ text, label }: SpeakButtonProps) {
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label={label}
      style={{
        display: 'grid',
        placeItems: 'center',
        width: 64,
        height: 64,
        borderRadius: 9999,
        fontSize: '1.6rem',
        background: 'var(--primary)',
        color: 'var(--primary-fg)',
        boxShadow: 'var(--shadow-pop)',
      }}
    >
      🔈
    </button>
  );
}
