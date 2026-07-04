import { motion } from 'framer-motion';

export type BeeReaction = 'idle' | 'celebrate' | 'encourage';

interface BeeMascotProps {
  reaction?: BeeReaction;
  /** Font size in px. */
  size?: number;
  /** Ambient hover-float (used for the resting bee guide). */
  float?: boolean;
  className?: string;
}

/**
 * "Ong" — the Math World mascot. A single, consistent friendly character that
 * guides the child across every screen (Constitution I + Visual Standards).
 * Reactions are purposeful: celebrate on a correct answer, encourage on a miss.
 */
const variants = {
  idle: { y: 0, scale: 1, rotate: 0 },
  celebrate: { y: [0, -18, 0], scale: [1, 1.2, 1], transition: { repeat: 2, duration: 0.4 } },
  encourage: { rotate: [-6, 6, 0], transition: { repeat: 1, duration: 0.3 } },
};

export function BeeMascot({ reaction = 'idle', size = 32, float = false, className = '' }: BeeMascotProps) {
  const floatClass = float && reaction === 'idle' ? 'ma-bee-float' : '';
  return (
    <motion.span
      aria-hidden="true"
      animate={reaction}
      variants={variants}
      className={`${floatClass} ${className}`.trim()}
      style={{
        fontSize: size,
        display: 'inline-block',
        lineHeight: 1,
        userSelect: 'none',
        filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.15))',
      }}
    >
      🐝
    </motion.span>
  );
}
