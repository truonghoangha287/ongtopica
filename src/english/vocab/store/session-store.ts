import { create } from 'zustand';
import type { Session } from '@/english/vocab/types/vocab.types';

interface SessionState {
  session: Session | null;
  currentIndex: number;
  retryCount: number;
  /** Hearts this session started with. 0 means hearts mode is off. */
  heartsMax: number;
  heartsRemaining: number;
  setSession: (session: Session, heartsMax: number) => void;
  advance: () => void;
  incrementRetry: () => void;
  loseHeart: () => void;
  restart: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  currentIndex: 0,
  retryCount: 0,
  heartsMax: 0,
  heartsRemaining: 0,
  // The caller passes the heart count so the store stays free of localStorage.
  setSession: (session, heartsMax) =>
    set({ session, currentIndex: 0, retryCount: 0, heartsMax, heartsRemaining: heartsMax }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, retryCount: 0 })),
  incrementRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),
  // With hearts off this must be a true no-op. Returning `{}` would still merge
  // into a fresh state object, so `Object.is(next, prev)` fails and every
  // subscriber re-renders; returning `s` itself makes zustand skip the update
  // entirely. `advance()` deliberately leaves `heartsRemaining` alone, so hearts
  // carry across words.
  loseHeart: () =>
    set((s) => (s.heartsMax === 0 ? s : { heartsRemaining: Math.max(0, s.heartsRemaining - 1) })),
  restart: () => set((s) => ({ currentIndex: 0, retryCount: 0, heartsRemaining: s.heartsMax })),
  clearSession: () =>
    set({ session: null, currentIndex: 0, retryCount: 0, heartsMax: 0, heartsRemaining: 0 }),
}));
