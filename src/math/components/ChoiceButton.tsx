import { ShapeGlyph } from '@/math/components/ShapeGlyph';
import { ObjectCluster } from '@/math/components/ObjectCluster';
import type { ChoiceSpec } from '@/math/types/math.types';

interface ChoiceButtonProps {
  choice: ChoiceSpec;
  onTap: () => void;
  disabled?: boolean;
  /** When true, outline this option as the revealed correct answer. */
  revealed?: boolean;
  ariaLabel: string;
}

/** A single tappable answer tile. Renders a numeral, an object, a cluster, or a shape. */
export function ChoiceButton({ choice, onTap, disabled, revealed, ariaLabel }: ChoiceButtonProps) {
  return (
    <button
      className="card"
      onClick={onTap}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 120,
        padding: 12,
        outline: revealed ? '3px solid var(--primary)' : 'none',
        outlineOffset: 2,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {choice.shape ? (
        <ShapeGlyph shape={choice.shape} title={undefined} />
      ) : choice.count != null && choice.emoji ? (
        <ObjectCluster emoji={choice.emoji} count={choice.count} glyphSize="1.6rem" />
      ) : choice.emoji ? (
        <span aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>
          {choice.emoji}
        </span>
      ) : (
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--ink)' }}>
          {choice.label}
        </span>
      )}
    </button>
  );
}
