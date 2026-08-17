import { motion, useReducedMotion } from 'framer-motion';

interface HeartRowProps {
  /** Hearts left in the current session. */
  remaining: number;
  /** Hearts the session started with. 0 = hearts mode is off. */
  max: number;
}

const FULL = '❤️';
const SPENT = '🤍';

/**
 * Renders the hearts left in a session. Nothing renders when hearts are off,
 * so callers do not need their own guard.
 *
 * The count is spoken through the live region's own text (visually hidden), not
 * an aria-label — screen readers announce a live region's content when it
 * changes, which is exactly the moment a heart is lost.
 */
export function HeartRow({ remaining, max }: HeartRowProps) {
  const reduce = useReducedMotion();
  if (max <= 0) return null;

  return (
    <div
      data-testid="heart-row"
      role="status"
      aria-live="polite"
      style={{ display: 'inline-flex', gap: 6, lineHeight: 1 }}
    >
      <span style={{ position: 'absolute', left: '-9999px' }}>
        {`${remaining} of ${max} hearts left`}
      </span>
      {Array.from({ length: max }, (_, i) => {
        const spent = i >= remaining;
        // Hearts are spent right-to-left, so index === remaining is the one
        // just lost — pop it once, unless the child asked for less motion.
        const justLost = spent && i === remaining && !reduce;
        return (
          <motion.span
            key={i}
            aria-hidden="true"
            animate={justLost ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}
            transition={{ duration: 0.45 }}
            style={{ fontSize: '1.5rem', opacity: spent ? 0.55 : 1 }}
          >
            {spent ? SPENT : FULL}
          </motion.span>
        );
      })}
    </div>
  );
}
