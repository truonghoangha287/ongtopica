import { create } from 'zustand';
import type { Session } from '@/english/vocab/types/vocab.types';

interface SessionState {
  session: Session | null;
  currentIndex: number;
  retryCount: number;
  setSession: (session: Session) => void;
  advance: () => void;
  incrementRetry: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  currentIndex: 0,
  retryCount: 0,
  setSession: (session) => set({ session, currentIndex: 0, retryCount: 0 }),
  advance: () => set((s) => ({ currentIndex: s.currentIndex + 1, retryCount: 0 })),
  incrementRetry: () => set((s) => ({ retryCount: s.retryCount + 1 })),
  clearSession: () => set({ session: null, currentIndex: 0, retryCount: 0 }),
}));
