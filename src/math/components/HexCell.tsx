import { useTranslation } from 'react-i18next';
import type { MathTopic } from '@/math/types/math.types';
import { HEX_WIDTH, HEX_HEIGHT } from '@/math/constants/math-constants';

interface HexCellProps {
  topic: MathTopic;
  stars: number;
  unlocked: boolean;
  isCurrent: boolean;
  onOpen: (id: string) => void;
}

const HEX_CLIP = 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)';

/** Gold/dim three-star row shown on an explored cell. */
function StarRow({ stars }: { stars: number }) {
  return (
    <span aria-hidden="true" style={{ fontSize: '0.68rem', letterSpacing: '1px' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ color: i < stars ? 'var(--star)' : 'oklch(85% 0.02 85)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * A single honeycomb cell in the Skills Hive. Renders as a real <button> so it
 * is keyboard- and screen-reader-operable (Constitution II); the hexagon shape
 * is purely visual via clip-path. Locked cells are disabled teasers.
 */
export function HexCell({ topic, stars, unlocked, isCurrent, onOpen }: HexCellProps) {
  const { t } = useTranslation('math');
  const name = t(topic.nameKey);
  const locked = !unlocked;

  const bg = isCurrent
    ? 'var(--ma)'
    : locked
      ? 'oklch(93.5% 0.01 90)'
      : `oklch(93% 0.06 ${topic.hue})`;
  const ring = isCurrent
    ? 'inset 0 0 0 4px #fff'
    : topic.olympiad
      ? 'inset 0 0 0 3px var(--ma)'
      : 'inset 0 0 0 3px rgba(255,255,255,.6)';

  const ariaLabel = locked
    ? t('hub.cellLockedAria', { name, count: topic.unlockStars ?? 0 })
    : isCurrent
      ? t('hub.cellCurrentAria', { name })
      : t('hub.cellAria', { name, stars });

  return (
    <button
      className="ma-hex"
      onClick={() => unlocked && onOpen(topic.id)}
      disabled={locked}
      aria-label={ariaLabel}
      style={{
        position: 'absolute',
        left: topic.left,
        top: topic.top,
        width: HEX_WIDTH,
        height: HEX_HEIGHT,
        clipPath: HEX_CLIP,
        background: bg,
        color: isCurrent ? '#fff' : 'var(--ink)',
        borderRadius: 0,
        boxShadow: ring,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        opacity: locked ? 0.72 : 1,
        zIndex: isCurrent ? 5 : 1,
        fontWeight: 900,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>
        {locked ? '🔒' : topic.icon}
      </span>
      <span aria-hidden="true" style={{ fontSize: '0.75rem', textAlign: 'center', color: locked ? 'var(--muted-fg)' : undefined }}>
        {name}
      </span>
      {locked ? (
        <span aria-hidden="true" style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted-fg)' }}>
          {t('hub.unlockAtStars', { count: topic.unlockStars ?? 0 })}
        </span>
      ) : isCurrent ? (
        <span aria-hidden="true" style={{ fontSize: '0.66rem', fontWeight: 800, opacity: 0.95 }}>
          {t('hub.continue')}
        </span>
      ) : topic.olympiad ? (
        <span aria-hidden="true" style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--ma-ink)' }}>
          {t('hub.olympiadTag')}
        </span>
      ) : (
        <StarRow stars={stars} />
      )}
    </button>
  );
}
