import { motion } from 'framer-motion';

type MascotReaction = 'idle' | 'celebrate' | 'encourage';

interface MascotProps {
  reaction: MascotReaction;
}

const variants = {
  idle: { y: 0, scale: 1 },
  celebrate: {
    y: [0, -20, 0],
    scale: [1, 1.2, 1],
    transition: { repeat: 2, duration: 0.4 },
  },
  encourage: {
    rotate: [-5, 5, 0],
    transition: { repeat: 1, duration: 0.3 },
  },
};

export function Mascot({ reaction }: MascotProps) {
  return (
    <motion.div
      aria-hidden="true"
      animate={reaction}
      variants={variants}
      style={{ fontSize: '4rem', display: 'inline-block', userSelect: 'none' }}
    >
      🦉
    </motion.div>
  );
}
