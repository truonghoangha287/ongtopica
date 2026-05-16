import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mascot } from '@/shared/components/Mascot';
import { CelebrationEffect } from '@/shared/components/CelebrationEffect';
import { AudioPlayer } from '@/shared/components/AudioPlayer';
import { seededShuffle } from '@/shared/utils/seeded-shuffle';
import type { UnscrambleActivityProps } from '@/english/vocab/types/vocab.types';

interface Tile { letter: string; key: string; }

export function UnscrambleActivity({ word, callbacks }: UnscrambleActivityProps) {
  const { t } = useTranslation('vocab');
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
      setTimeout(() => setShakingKey(null), 400);
      return;
    }
    const newPlaced = placed.map((p, i) => (i === nextEmptyIdx ? tile : p));
    setPlaced(newPlaced);
    if (newPlaced.every(Boolean)) {
      // Per-tile validation guarantees the assembled word is always correct
      setMascotReaction('celebrate');
      setCelebrating(true);
      setDone(true);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
      <CelebrationEffect active={celebrating} />
      <p style={{ fontSize: '1.2rem' }}>{t('activities.unscramble.prompt')}</p>
      <img src={word.pictureAsset} alt={word.text} style={{ width: 200, borderRadius: 12 }} />
      <AudioPlayer src={word.audioAsset} autoPlay />
      <Mascot reaction={mascotReaction} />
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px' }} />
      <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="answer slots">
        {placed.map((tile, i) => (
          <button
            key={i}
            onClick={() => handleSlotTap(i)}
            aria-label={tile ? `slot ${i + 1}: ${tile.letter}` : `empty slot ${i + 1}`}
            style={{
              width: 48, height: 56, borderRadius: 8,
              fontSize: '1.5rem', fontWeight: 'bold',
              background: tile ? '#e8f0fe' : 'white',
              cursor: tile ? 'pointer' : 'default',
              minWidth: 48, minHeight: 48,
              border: '2px solid #4A90E2',
            }}
          >
            {tile?.letter ?? ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {available.map((tile) => (
          <motion.button
            key={tile.key}
            onClick={() => handleTileTap(tile.key)}
            aria-label={`letter ${tile.letter}`}
            animate={shakingKey === tile.key ? { x: [0, -6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.35 }}
            style={{
              width: 48, height: 56, borderRadius: 8, fontSize: '1.5rem', fontWeight: 'bold',
              background: '#f0f0f0',
              border: '2px solid #ddd',
              cursor: 'pointer', minWidth: 48, minHeight: 48,
            }}
          >
            {tile.letter}
          </motion.button>
        ))}
      </div>
      {done && (
        <button
          onClick={callbacks.onAdvance}
          style={{ minWidth: 140, minHeight: 52, fontSize: '1.1rem', borderRadius: 12, marginTop: 8, cursor: 'pointer', background: '#4A90E2', color: 'white', border: 'none' }}
        >
          {t('activities.introduce.nextButton')}
        </button>
      )}
    </div>
  );
}
