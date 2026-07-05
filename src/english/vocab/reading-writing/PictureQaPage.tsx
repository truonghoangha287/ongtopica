import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { playPop, playWin, playBuzz } from '@/shared/utils/sfx';
import { speak } from '@/shared/utils/speak';
import { PICTURE_QA_ITEMS } from './data/picture-qa-items';
import type { PictureQaItem } from './data/picture-qa-items';

const SESSION_SIZE = 5;

function pickItems(): PictureQaItem[] {
  return [...PICTURE_QA_ITEMS].sort(() => Math.random() - 0.5).slice(0, SESSION_SIZE);
}

export function PictureQaPage() {
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();

  const [seed, setSeed] = useState(0);
  const items = useMemo(pickItems, [seed]);

  const [index, setIndex] = useState(0);
  // Correct answers for the current item, keyed by question index.
  const [solved, setSolved] = useState<Record<number, true>>({});
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const [mascot, setMascot] = useState<'idle' | 'celebrate' | 'encourage'>('idle');

  const item = items[index];
  const isLast = index === items.length - 1;
  const itemDone = item ? Object.keys(solved).length === item.questions.length : false;
  const finished = itemDone && isLast;

  useEffect(() => {
    if (finished) {
      setMascot('celebrate');
      playWin();
    }
  }, [finished]);

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setSolved({});
    setWrongKey(null);
    setMascot('idle');
  }, []);

  const advance = () => {
    setIndex((i) => i + 1);
    setSolved({});
    setWrongKey(null);
    setMascot('idle');
  };

  const handleTap = (qIndex: number, option: string) => {
    if (solved[qIndex]) return;
    const question = item.questions[qIndex];
    if (option === question.answer) {
      playPop();
      setSolved((prev) => ({ ...prev, [qIndex]: true }));
      setWrongKey(null);
      setMascot('celebrate');
    } else {
      playBuzz();
      setWrongKey(`${qIndex}:${option}`);
      setMascot('encourage');
      setTimeout(() => {
        setWrongKey((k) => (k === `${qIndex}:${option}` ? null : k));
        setMascot('idle');
      }, 700);
    }
  };

  if (!item) return null;

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <CelebrationEffect active={finished} />
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('readingWriting.backButton')}>
          ✕
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{t('activities.pictureQa.title')}</h1>
        <span className="badge" style={{ marginLeft: 'auto' }} aria-live="polite">
          {t('activities.pictureQa.progress', { done: index + (itemDone ? 1 : 0), total: items.length })}
        </span>
      </header>
      <div className="progress" style={{ marginBottom: 14 }}>
        <div
          style={{
            width: `${((index + (itemDone ? 1 : 0)) / items.length) * 100}%`,
            height: '100%',
            background: 'var(--primary)',
            borderRadius: 'inherit',
          }}
        />
      </div>

      {finished ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <Mascot reaction="celebrate" />
          <h2 style={{ fontSize: '1.7rem', margin: 0 }}>{t('activities.pictureQa.wellDone')}</h2>
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
        <>
          <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 14px' }}>
            {t('activities.pictureQa.prompt')}
          </p>
          <div
            role="img"
            aria-label={item.sceneLabel}
            style={{
              width: '100%',
              maxWidth: 320,
              height: 150,
              margin: '0 auto 18px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '4rem',
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: 'linear-gradient(180deg, var(--secondary), var(--paper))',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <span aria-hidden="true">{item.sceneEmoji}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 340, margin: '0 auto' }}>
            {item.questions.map((q, qi) => (
              <div key={qi} role="group" aria-label={q.text}>
                <button
                  onClick={() => speak(q.text)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    fontWeight: 800,
                    fontSize: '1rem',
                    marginBottom: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {qi + 1} · {q.text} <span aria-hidden="true">🔊</span>
                </button>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {q.options.map((opt) => {
                    const right = solved[qi] === true && opt === q.answer;
                    const locked = solved[qi] === true;
                    const isWrong = wrongKey === `${qi}:${opt}`;
                    return (
                      <motion.button
                        key={opt}
                        aria-label={opt}
                        disabled={locked}
                        onClick={() => handleTap(qi, opt)}
                        animate={isWrong ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                        transition={{ duration: 0.3 }}
                        style={{
                          minHeight: 48,
                          padding: '8px 16px',
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          cursor: locked ? 'default' : 'pointer',
                          border: '2px solid',
                          borderColor: right
                            ? 'var(--success)'
                            : isWrong
                              ? 'var(--destructive)'
                              : 'transparent',
                          background: right
                            ? 'var(--success)'
                            : isWrong
                              ? 'var(--destructive)'
                              : 'var(--paper)',
                          color: right || isWrong ? 'var(--paper)' : 'var(--ink, inherit)',
                          boxShadow: 'var(--shadow-card)',
                          opacity: locked && !right ? 0.5 : 1,
                        }}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20, minHeight: 60 }}>
            {itemDone ? (
              <button
                className="btn-accent"
                onClick={advance}
                style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
              >
                <span>{t('activities.introduce.nextButton', 'Next')}</span> <span aria-hidden="true">→</span>
              </button>
            ) : (
              wrongKey && <Mascot reaction={mascot} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
