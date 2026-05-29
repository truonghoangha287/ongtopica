import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  activeProfileId: string | null;
  setActiveProfile: (id: string) => void;
  clearActiveProfile: () => void;
}

// Persist the active profile so progress/stars survive a page reload.
// Without this, activeProfileId resets to null on reload and every
// progress query is gated to return empty (stars vanish in the UI).
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfileId: null,
      setActiveProfile: (id) => set({ activeProfileId: id }),
      clearActiveProfile: () => set({ activeProfileId: null }),
    }),
    { name: 'ongtopica-active-profile' },
  ),
);
