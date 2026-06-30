import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { seededShuffle } from '@/shared/utils/seeded-shuffle';
import { useProfileStore } from '@/shared/store/profile-store';
import { playPop, playBuzz, playWin } from '@/shared/utils/sfx';
import { recordWrongTap, recordCompletion } from '@/english/vocab/services/attempt-stats';
import type { UnscrambleActivityProps } from '@/english/vocab/types/vocab.types';

interface Tile { letter: string; key: string; }

export function UnscrambleActivity({ word, callbacks }: UnscrambleActivityProps) {
  const { t } = useTranslation('vocab');
  const childId = useProfileStore((s) => s.activeProfileId);
  const letters = word.text.split('');

  const scrambled: Tile[] = useMemo(
    () => seededShuffle(letters.map((letter, i) => ({ letter, key: `${i}` })), word.id),
    [word.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [placed, setPlaced] = useState<(Tile | null)[]>(Array(letters.length).fill(null));
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'celebrate' | 'encourage'>('idle');
  const [celebrating, setCelebrating] = useState(false);
  const [done, setDone] = useState(false);
  // Key of the tile shaking after a wrong-position tap (per-tile validation)
  const [shakingKey, setShakingKey] = useState<string | null>(null);
  // Screen-reader announcement of the latest placement / outcome
  const [announce, setAnnounce] = useState('');

  const usedKeys = new Set(placed.filter(Boolean).map((t) => t!.key));
  const available = scrambled.filter((t) => !usedKeys.has(t.key));

  // Tap a letter tile → validate against expected position before placing
  const handleTileTap = (key: string) => {
    if (done) return;
    const nextEmptyIdx = placed.findIndex((p) => p === null);
    if (nextEmptyIdx === -1) return;
    const tile = scrambled.find((t) => t.key === key);
    if (!tile) return;
    // Reject if letter doesn't match expected position — shake tile, never place it
    if (tile.letter !== word.text[nextEmptyIdx]) {
      setShakingKey(key);
      setAnnounce(t('activities.unscramble.announceWrong'));
      playBuzz();
      recordWrongTap(childId, word.id);
      setTimeout(() => setShakingKey(null), 400);
      return;
    }
    const newPlaced = placed.map((p, i) => (i === nextEmptyIdx ? tile : p));
    setPlaced(newPlaced);
    playPop();
    setAnnounce(t('activities.unscramble.announcePlaced', { letter: tile.letter }));
    if (newPlaced.every(Boolean)) {
      // Per-tile validation guarantees the assembled word is always correct
      setMascotReaction('celebrate');
      setCelebrating(true);
      setDone(true);
      setAnnounce(t('activities.unscramble.announceDone', { word: word.text }));
      playWin();
      recordCompletion(childId, word.id);
      callbacks.onCorrect();
    }
  };

  // Tap a filled slot → return the letter to the available pool (undo)
  const handleSlotTap = (idx: number) => {
    if (done) return;
    if (!placed[idx]) return;
    setPlaced((prev) => prev.map((p, i) => (i === idx ? null : p)));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '64px 24px 32px' }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1rem', color: 'var(--muted-fg)', fontWeight: 700, margin: 0 }}>{t('activities.unscramble.prompt')}</p>
      <div className="card" style={{ display: 'grid', placeItems: 'center', width: 180, height: 180, padding: 18 }}>
        <img src={word.pictureAsset} alt={word.text} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
      </div>
      <AudioPlayer src={word.audioAsset} autoPlay />
      <Mascot reaction={mascotReaction} />
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }}>
        {announce}
      </div>
      <motion.div
        style={{ display: 'flex', gap: 8 }}
        role="group"
        aria-label="answer slots"
        animate={done ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.45 }}
      >
        {placed.map((tile, i) => (
          <button
            key={i}
            onClick={() => handleSlotTap(i)}
            disabled={done}
            aria-label={tile ? `slot ${i + 1}: ${tile.letter}` : `empty slot ${i + 1}`}
            style={{
              width: 52, height: 60, borderRadius: 12,
              fontSize: '1.6rem', fontWeight: 800,
              background: done ? 'var(--success)' : tile ? 'var(--secondary)' : 'var(--paper)',
              color: done ? 'white' : 'var(--ink)',
              cursor: tile && !done ? 'pointer' : 'default',
              border: `2px solid ${done ? 'var(--success)' : 'var(--primary)'}`,
              transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease',
            }}
          >
            {tile?.letter ?? ''}
          </button>
        ))}
      </motion.div>
      {!done && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {available.map((tile) => (
            <motion.button
              key={tile.key}
              onClick={() => handleTileTap(tile.key)}
              aria-label={`letter ${tile.letter}`}
              animate={shakingKey === tile.key ? { x: [0, -6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.35 }}
              style={{
                width: 52, height: 60, borderRadius: 12, fontSize: '1.6rem', fontWeight: 800,
                background: 'var(--paper)', color: 'var(--ink)',
                boxShadow: 'var(--shadow-card)',
                cursor: 'pointer',
              }}
            >
              {tile.letter}
            </motion.button>
          ))}
        </div>
      )}
      {done && (
        <button
          className="btn-accent"
          onClick={callbacks.onAdvance}
          style={{ minWidth: 160, minHeight: 56, fontSize: '1.15rem', padding: '0 28px' }}
        >
          <span>{t('activities.introduce.nextButton')}</span> <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
