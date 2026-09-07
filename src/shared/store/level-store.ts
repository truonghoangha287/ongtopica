import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LEVEL, type LevelId } from '@/english/vocab/data/levels';

interface LevelState {
  activeLevel: LevelId;
  setActiveLevel: (level: LevelId) => void;
}

/**
 * Which Cambridge level the child is working at.
 *
 * Persisted, like the active profile: a child works at one level for weeks at a
 * time, so having it reset to Starters on every launch would be a daily
 * annoyance. Chosen explicitly by a grown-up rather than promoted automatically
 * -- moving up a level is a teaching decision, not something progress should
 * trigger on its own.
 */
export const useLevelStore = create<LevelState>()(
  persist(
    (set) => ({
      activeLevel: DEFAULT_LEVEL,
      setActiveLevel: (activeLevel) => set({ activeLevel }),
    }),
    { name: 'ongtopica-active-level' },
  ),
);
