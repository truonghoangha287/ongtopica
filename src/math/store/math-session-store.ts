import { create } from 'zustand';
import type { MathSession } from '@/math/types/math.types';

interface MathSessionState {
  session: MathSession | null;
  currentIndex: number;
  retryCount: number;
  setSession: (session: MathSession) => void;
  advance: () => void;
  incrementRetry: () => void;
  clearSession: () => void;
}

export const useMathSessionStore = create<MathSessionState>((set) => ({
  session: null,
  currentIndex: 0,
  retryCount: 0,
  setSession: (session) => set({ session, currentIndex: 0, retryCount: 0 }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, retryCount: 0 })),
  incrementRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),
  clearSession: () => set({ session: null, currentIndex: 0, retryCount: 0 }),
}));
