import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationEffectProps {
  active: boolean;
}

export function CelebrationEffect({ active }: CelebrationEffectProps) {
  useEffect(() => {
    if (!active) return;
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [active]);
  return null;
}
