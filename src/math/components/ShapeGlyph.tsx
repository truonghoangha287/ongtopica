import type { ShapeKind } from '@/math/types/math.types';

interface ShapeGlyphProps {
  shape: ShapeKind;
  size?: number;
  /** Accessible name; when omitted the shape is decorative (aria-hidden). */
  title?: string;
}

const FILL = 'var(--primary)';

/** Inline SVG body per shape, drawn in a 100×100 viewBox. */
function shapeBody(shape: ShapeKind) {
  switch (shape) {
    case 'circle':
      return <circle cx="50" cy="50" r="42" fill={FILL} />;
    case 'square':
      return <rect x="10" y="10" width="80" height="80" rx="8" fill={FILL} />;
    case 'rectangle':
      return <rect x="6" y="26" width="88" height="48" rx="8" fill={FILL} />;
    case 'triangle':
      return <polygon points="50,10 92,86 8,86" fill={FILL} />;
    case 'diamond':
      return <polygon points="50,8 90,50 50,92 10,50" fill={FILL} />;
    case 'oval':
      return <ellipse cx="50" cy="50" rx="44" ry="30" fill={FILL} />;
    case 'star':
      return (
        <polygon
          points="50,6 61,38 95,38 67,58 78,90 50,70 22,90 33,58 5,38 39,38"
          fill={FILL}
        />
      );
    case 'heart':
      return (
        <path
          d="M50 86 L18 52 C6 40 12 18 32 18 C42 18 48 26 50 30 C52 26 58 18 68 18 C88 18 94 40 82 52 Z"
          fill={FILL}
        />
      );
  }
}

/** Crisp, asset-free shape tile with an SR title (Constitution II). */
export function ShapeGlyph({ shape, size = 88, title }: ShapeGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {shapeBody(shape)}
    </svg>
  );
}
