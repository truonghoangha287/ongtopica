import type { ShapeKind } from '@/math/types/math.types';

/** All shapes taught in the Shapes topic, in teaching order (simplest first). */
export const SHAPE_KINDS: ShapeKind[] = [
  'circle',
  'square',
  'triangle',
  'rectangle',
  'star',
  'heart',
  'diamond',
  'oval',
];

/** English display label per shape (also used as the i18n fallback). */
export const SHAPE_LABELS: Record<ShapeKind, string> = {
  circle: 'circle',
  square: 'square',
  triangle: 'triangle',
  rectangle: 'rectangle',
  star: 'star',
  heart: 'heart',
  diamond: 'diamond',
  oval: 'oval',
};
