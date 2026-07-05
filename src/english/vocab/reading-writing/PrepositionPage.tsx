import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { playPop, playWin, playBuzz } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import { PREPOSITION_ITEMS } from './data/preposition-items';
import type { Preposition, PrepositionItem } from './data/preposition-items';

const OPTIONS: Preposition[] = ['in', 'on', 'under'];
const SESSION_SIZE = 5;
const POS = { on: { top: -6 }, in: { top: 30 }, under: { top: 74 } } as const;

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export function PrepositionPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<Preposition | null>(null);
  const [mascot, setMascot] = useState<'idle' | 'celebrate' | 'encourage'>('idle');

  const items: PrepositionItem[] = useMemo(
    () => shuffle(PREPOSITION_ITEMS).slice(0, SESSION_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const chips: Preposition[] = useMemo(() => shuffle(OPTIONS), [seed, index]);
  const item = items[index];
  const isLast = index === items.length - 1;
  const finished = index >= items.length;

  useEffect(() => {
    if (item) speak(t('activities.preposition.sentence', { object: item.object }));
  }, [item, t]);

  useEffect(() => {
    if (finished) playWin();
  }, [finished]);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setSolved(false);
    setWrong(null);
    setMascot('idle');
  }, []);

  const advance = () => {
    setSolved(false);
    setWrong(null);
    setMascot('idle');
    setIndex((i) => i + 1);
  };

  const pick = (opt: Preposition) => {
    if (solved || !item) return;
    if (opt === item.answer) {
      playPop();
      setSolved(true);
      setWrong(null);
      setMascot('celebrate');
    } else {
      playBuzz();
      setWrong(opt);
      setMascot('encourage');
      speak(t('activities.preposition.tryAgain'));
      setTimeout(() => setMascot('idle'), 800);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <style>{`
        .prep-scene{position:relative;width:180px;height:130px;margin:8px auto}
        .prep-box{position:absolute;left:40px;bottom:6px;width:100px;height:64px;border-radius:10px;
          background:linear-gradient(180deg,oklch(85% 0.09 65),oklch(72% 0.12 55));box-shadow:var(--shadow-card)}
        .prep-ball{position:absolute;left:70px;font-size:2.4rem}
        .prep-slot{display:inline-block;min-width:56px;border-bottom:3px solid var(--primary);
          color:var(--primary);padding:0 6px;text-align:center}
      `}</style>
      <CelebrationEffect active={finished} />
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('readingWriting.backButton')}>
          ✕
        </button>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{t('activities.preposition.title')}</h1>
        <span className="badge" style={{ marginLeft: 'auto' }} aria-live="polite">
          {t('activities.preposition.progress', {
            done: Math.min(index + (finished ? 0 : 1), items.length),
            total: items.length,
          })}
        </span>
      </header>

      {finished ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.8rem', margin: 0, textAlign: 'center' }}>
            {t('activities.preposition.wellDone')}
          </h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('readingWriting.playAgain')}
            </button>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('readingWriting.exit')}
            </button>
          </div>
        </div>
      ) : (
        item && (
          <>
            <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 8px' }}>
              {t('activities.preposition.prompt')}
            </p>
            <Mascot reaction={mascot} />
            <div className="card" style={{ padding: '8px 12px 4px' }}>
              <div className="prep-scene">
                <div className="prep-box" aria-hidden="true" />
                <motion.span
                  className="prep-ball"
                  aria-label={`${item.object} ${item.answer} the box`}
                  animate={POS[item.answer]}
                  transition={{ type: 'tween', duration: 0.35, ease: [0.4, 1.4, 0.5, 1] }}
                  style={POS[item.answer]}
                >
                  {item.emoji}
                </motion.span>
              </div>
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', margin: '14px 0' }}>
              The {item.object} is <span className="prep-slot">{solved ? item.answer : '___'}</span> the box.
            </p>

            <div
              role="group"
              aria-label={t('activities.preposition.prompt')}
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {chips.map((opt) => {
                const right = solved && opt === item.answer;
                const isWrong = wrong === opt;
                return (
                  <motion.button
                    key={opt}
                    className="card"
                    aria-label={opt}
                    onClick={() => pick(opt)}
                    disabled={solved}
                    animate={isWrong ? { x: [0, -6, 6, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      minWidth: 88,
                      minHeight: 56,
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      padding: '0 20px',
                      cursor: solved ? 'default' : 'pointer',
                      border: '2px solid',
                      borderColor: right ? 'var(--success)' : isWrong ? 'var(--destructive)' : 'transparent',
                      color: right ? 'var(--success)' : isWrong ? 'var(--destructive)' : 'var(--ink)',
                      background: right ? 'oklch(93% 0.09 150)' : 'var(--paper)',
                    }}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, minHeight: 32 }}>
              {wrong && !solved && (
                <span style={{ color: 'var(--destructive)', fontWeight: 700 }}>
                  {t('activities.preposition.tryAgain')}
                </span>
              )}
            </div>

            {solved && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                <button
                  className="btn-accent"
                  onClick={advance}
                  style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
                >
                  <span>{isLast ? t('readingWriting.exit') : t('activities.introduce.nextButton', 'Next')}</span>{' '}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
