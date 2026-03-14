import { create } from "zustand";

interface TopBarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useTopBarStore = create<TopBarState>((set) => ({
  isOpen: true,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
}));
