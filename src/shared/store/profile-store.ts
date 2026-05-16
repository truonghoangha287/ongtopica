import { create } from 'zustand';

interface ProfileState {
  activeProfileId: string | null;
  setActiveProfile: (id: string) => void;
  clearActiveProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  activeProfileId: null,
  setActiveProfile: (id) => set({ activeProfileId: id }),
  clearActiveProfile: () => set({ activeProfileId: null }),
}));
