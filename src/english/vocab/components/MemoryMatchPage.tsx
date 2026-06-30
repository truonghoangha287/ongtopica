import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getWordSet } from '@/data/yle-starters/index';
import { useWordProgress } from '@/english/vocab/hooks/useWordProgress';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { wordSetIcon } from '@/data/yle-starters/icons';
import { pickMemoryWords, buildMemoryDeck } from '@/english/vocab/services/memory-match';
import { playPop, playWin } from '@/shared/utils/sfx';
import { MEMORY_MATCH_PAIRS } from '@/shared/constants/game-constants';
import type { WordProgressRow } from '@/shared/db/schema';
import type { MemoryCard } from '@/english/vocab/services/memory-match';

const FLIP_BACK_MS = 900;

export function MemoryMatchPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('vocab');
  const navigate = useNavigate();
  const wordSet = id ? getWordSet(id) : undefined;
  const wordProgress = useWordProgress();

  const [seed, setSeed] = useState(() => crypto.randomUUID());
  const [progressMap, setProgressMap] = useState<Record<string, WordProgressRow>>({});
  const [ready, setReady] = useState(false);
  const [flipped, setFlipped] = useState<string[]>([]); // card ids currently face-up (unmatched)
  const [matched, setMatched] = useState<Set<string>>(new Set()); // matched wordIds
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!wordSet) return;
    wordProgress.getWordSetProgress(wordSet.id).then((rows) => {
      setProgressMap(Object.fromEntries(rows.map((r) => [r.wordId, r])));
      setReady(true);
    });
  }, [wordSet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const deck: MemoryCard[] = useMemo(() => {
    if (!wordSet || !ready) return [];
    const words = pickMemoryWords(wordSet, progressMap, MEMORY_MATCH_PAIRS);
    return buildMemoryDeck(words, seed);
  }, [wordSet, ready, progressMap, seed]);

  const totalPairs = deck.length / 2;
  const isComplete = ready && totalPairs > 0 && matched.size === totalPairs;

  useEffect(() => {
    if (isComplete) playWin();
  }, [isComplete]);

  const restart = useCallback(() => {
    setMatched(new Set());
    setFlipped([]);
    setLocked(false);
    setSeed(crypto.randomUUID());
  }, []);

  const handleFlip = (card: MemoryCard) => {
    if (locked || !wordSet) return;
    if (matched.has(card.wordId) || flipped.includes(card.id)) return;

    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length === 2) {
      const [aId, bId] = next;
      const a = deck.find((c) => c.id === aId)!;
      const b = deck.find((c) => c.id === bId)!;
      if (a.wordId === b.wordId) {
        playPop();
        setMatched((prev) => new Set(prev).add(a.wordId));
        setFlipped([]);
        wordProgress.recordCorrect(a.wordId, wordSet.id);
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, FLIP_BACK_MS);
      }
    }
  };

  if (!wordSet) return <div className="page">Word set not found.</div>;

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <CelebrationEffect active={isComplete} />
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('settings.backButton')}>
          ✕
        </button>
        <span aria-hidden="true" style={{ fontSize: '1.6rem' }}>{wordSetIcon(wordSet.id)}</span>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{t('activities.memoryMatch.title')}</h1>
        <span className="badge" style={{ marginLeft: 'auto' }} aria-live="polite">
          {t('activities.memoryMatch.pairsFound', { found: matched.size, total: totalPairs })}
        </span>
      </header>
      <p style={{ color: 'var(--muted-fg)', fontWeight: 700, margin: '0 0 18px' }}>
        {t('activities.memoryMatch.prompt')}
      </p>

      {isComplete && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{t('activities.memoryMatch.wellDone')}</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-accent" onClick={restart} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('session.reviewAllButton')}
            </button>
            <button className="btn-primary" onClick={() => navigate(-1)} style={{ minHeight: 52, padding: '0 24px' }}>
              {t('session.exitButton')}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {deck.map((card) => {
          const faceUp = flipped.includes(card.id) || matched.has(card.wordId);
          const isMatched = matched.has(card.wordId);
          return (
            <motion.button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={faceUp || locked || isComplete}
              aria-label={faceUp ? card.word.text : t('activities.memoryMatch.title')}
              whileTap={faceUp ? undefined : { scale: 0.96 }}
              animate={{ scale: isMatched ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="card"
              style={{
                display: 'grid',
                placeItems: 'center',
                aspectRatio: '1 / 1',
                padding: 8,
                background: faceUp ? 'var(--paper)' : 'var(--secondary)',
                outline: isMatched ? '3px solid var(--success)' : 'none',
                outlineOffset: 2,
                cursor: faceUp ? 'default' : 'pointer',
              }}
            >
              {faceUp ? (
                card.kind === 'picture' ? (
                  <img src={card.word.pictureAsset} alt={card.word.text} style={{ maxWidth: '100%', maxHeight: '80%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}>{card.word.text}</span>
                )
              ) : (
                <span aria-hidden="true" style={{ fontSize: '1.8rem', opacity: 0.7 }}>🦉</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
