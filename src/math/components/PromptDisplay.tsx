import { ObjectCluster } from '@/math/components/ObjectCluster';
import type { PromptSpec } from '@/math/types/math.types';

interface PromptDisplayProps {
  prompt: PromptSpec;
}

const bigNumeral = { fontSize: '5rem', fontWeight: 900, lineHeight: 1, color: 'var(--ink)' } as const;

/** Render the question's visual. The spoken/caption text is handled by the player. */
export function PromptDisplay({ prompt }: PromptDisplayProps) {
  switch (prompt.kind) {
    case 'numeral':
      return <div style={bigNumeral}>{prompt.value}</div>;

    case 'word':
      return (
        <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--ink)', textTransform: 'capitalize' }}>
          {prompt.value}
        </div>
      );

    case 'dots':
      return <ObjectCluster emoji={prompt.emoji ?? '🔵'} count={prompt.count ?? 0} />;

    case 'expression':
      return <ExpressionPrompt value={String(prompt.value ?? '')} />;

    case 'shape-name':
      return (
        <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'var(--ink)', textTransform: 'capitalize' }}>
          {prompt.value}
        </div>
      );

    case 'sequence':
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
          {(prompt.sequence ?? []).map((item) => (
            <span
              key={item.id}
              aria-hidden="true"
              style={{
                fontSize: '2.8rem',
                lineHeight: 1,
                fontWeight: item.label === '?' ? 900 : 400,
                color: item.label === '?' ? 'var(--primary)' : 'inherit',
              }}
            >
              {item.emoji ?? item.label}
            </span>
          ))}
        </div>
      );

    case 'instruction':
    default:
      // The instruction text is rendered as the player's caption; no extra visual.
      return null;
  }
}

/** Show `a + b` (or `a − b`) as a large expression with supporting object pips. */
function ExpressionPrompt({ value }: { value: string }) {
  const match = /^(\d+)\s*([+\-])\s*(\d+)$/.exec(value);
  const display = value.replace('-', '−');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: '3.4rem', fontWeight: 900, color: 'var(--ink)' }}>{display} = ?</div>
      {match && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <ObjectCluster emoji="🔵" count={Number(match[1])} glyphSize="1.5rem" />
          <span aria-hidden="true" style={{ fontSize: '2rem', fontWeight: 900 }}>
            {match[2] === '+' ? '+' : '−'}
          </span>
          <ObjectCluster emoji={match[2] === '+' ? '🔵' : '⚪'} count={Number(match[3])} glyphSize="1.5rem" />
        </div>
      )}
    </div>
  );
}
