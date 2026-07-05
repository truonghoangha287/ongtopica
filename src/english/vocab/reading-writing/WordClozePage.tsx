import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { playPop, playBuzz, playWin } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import { pickClozeItems, isGap, type ClozeItem } from './data/cloze-items';

const ITEMS_PER_PLAY = 5;

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

/** Read the sentence aloud, speaking each gap as "blank" for pre-readers. */
const spokenText = (item: ClozeItem): string =>
  item.sentence.map((p) => (isGap(p) ? 'blank' : p.text)).join(' ').replace(/\s+/g, ' ').trim();

export function WordClozePage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  const [seed, setSeed] = useState(() => crypto.randomUUID());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => pickClozeItems(ITEMS_PER_PLAY), [seed]);

  const [index, setIndex] = useState(0);
  const [filled, setFilled] = useState<Record<number, string>>({}); // gapIndex -> bank key (correct only)
  const [selected, setSelected] = useState<string | null>(null); // selected bank key
  const [reaction, setReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [finished, setFinished] = useState(false);

  const item = items[index];
  const gapIndexes = useMemo(
    () => item.sentence.map((_, i) => i).filter((i) => isGap(item.sentence[i])),
    [item]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bankOrder = useMemo(() => shuffle(item.bank), [item, seed]);
  const solved = gapIndexes.every((gi) => filled[gi]);

  // Speak the sentence and reset per-item state whenever a new item appears.
  useEffect(() => {
    setFilled({});
    setSelected(null);
    setReaction('idle');
    speak(spokenText(item));
  }, [item]);

  useEffect(() => {
    if (finished) playWin();
  }, [finished]);

  const restart = useCallback(() => {
    setIndex(0);
    setFilled({});
    setSelected(null);
    setReaction('idle');
    setCelebrating(false);
    setFinished(false);
    setSeed(crypto.randomUUID());
  }, []);

  const placeInGap = (gapIndex: number) => {
    if (!selected || filled[gapIndex]) return;
    const answer = (item.sentence[gapIndex] as { answer: string }).answer;
    if (selected === answer) {
      playPop();
      setReaction('celebrate');
      setFilled((prev) => ({ ...prev, [gapIndex]: selected }));
      setSelected(null);
      setTimeout(() => setReaction('idle'), 700);
    } else {
      playBuzz();
      setReaction('encourage');
      setTimeout(() => setReaction('idle'), 800);
    }
  };

  const advance = () => {
    if (index + 1 >= items.length) {
      setCelebrating(true);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const gapStyleBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    minHeight: 40,
    margin: '0 4px',
    padding: '0 10px',
    borderRadius: 'var(--radius)',
    fontWeight: 800 as const,
    verticalAlign: 'middle',
  };

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <CelebrationEffect active={celebrating} />
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('readingWriting.backButton')}>
          ✕
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t('activities.wordCloze.title')}</h1>
        <span className="badge" style={{ marginLeft: 'auto' }} aria-live="polite">
          {t('activities.wordCloze.progress', { done: finished ? items.length : index + 1, total: items.length })}
        </span>
      </header>

      {finished ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <span aria-hidden="true" style={{ fontSize: '3.5rem' }}>🦉</span>
          <h2 style={{ fontSize: '1.7rem', margin: 0, textAlign: 'center' }}>{t('activities.wordCloze.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 56, padding: '0 24px' }}>
              {t('readingWriting.playAgain')}
            </button>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ minHeight: 56, padding: '0 24px' }}>
              {t('readingWriting.exit')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 8px' }}>
            {t('activities.wordCloze.prompt')}
          </p>

          <div
            className="progress"
            style={{ height: 8, borderRadius: 999, background: 'var(--secondary)', overflow: 'hidden', marginBottom: 14 }}
          >
            <div style={{ width: `${((index) / items.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width .3s' }} />
          </div>

          <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.9 }}>
              {item.emojiHint && <span aria-hidden="true" style={{ marginRight: 6 }}>{item.emojiHint}</span>}
              {item.sentence.map((part, i) =>
                isGap(part) ? (
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={filled[i] ? filled[i] : 'gap'}
                    onClick={() => placeInGap(i)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && placeInGap(i)}
                    data-filled={filled[i] ? 'true' : undefined}
                    style={{
                      ...gapStyleBase,
                      cursor: filled[i] ? 'default' : 'pointer',
                      border: filled[i] ? '2px solid var(--success)' : '2px dashed var(--border)',
                      background: filled[i] ? 'var(--success)' : 'var(--paper)',
                      color: filled[i] ? '#fff' : 'var(--muted-fg)',
                    }}
                  >
                    {filled[i] ?? '▁▁'}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <Mascot reaction={reaction} />
          </div>
          {reaction === 'encourage' && (
            <p style={{ textAlign: 'center', color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 8px' }}>
              {t('activities.wordCloze.tryAgain')}
            </p>
          )}

          <div
            style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', color: 'var(--muted-fg)', textTransform: 'uppercase', marginBottom: 8 }}
          >
            {t('activities.wordCloze.wordBank')}
          </div>
          <div
            role="group"
            aria-label={t('activities.wordCloze.wordBank')}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}
          >
            {bankOrder.map((b) => {
              const used = Object.values(filled).includes(b.key);
              const isSel = selected === b.key;
              return (
                <button
                  key={b.key}
                  aria-label={b.label}
                  disabled={used}
                  onClick={() => setSelected(isSel ? null : b.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    minHeight: 72,
                    minWidth: 72,
                    padding: '10px 14px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'var(--secondary)',
                    boxShadow: 'var(--shadow-card)',
                    fontWeight: 800,
                    cursor: used ? 'default' : 'pointer',
                    opacity: used ? 0.3 : 1,
                    outline: isSel ? '3px solid var(--primary)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>{b.emoji}</span>
                  {b.label}
                </button>
              );
            })}
          </div>

          {solved && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button
                className="btn-accent"
                onClick={advance}
                style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
              >
                <span>{t('activities.introduce.nextButton')}</span> <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
