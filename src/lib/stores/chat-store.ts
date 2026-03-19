import { create } from "zustand";

interface ChatState {
  isOpen: boolean;
  initialMessage: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openWithMessage: (msg: string) => void;
  consumeInitialMessage: () => string | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  initialMessage: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, initialMessage: null }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  openWithMessage: (msg: string) => set({ isOpen: true, initialMessage: msg }),
  consumeInitialMessage: () => {
    const msg = get().initialMessage;
    if (msg) set({ initialMessage: null });
    return msg;
  },
}));
