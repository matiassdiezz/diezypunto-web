import { create } from "zustand";
import { tryBuildPresetAssistantText } from "@/lib/chat/preset-replies";

interface ChatState {
  isOpen: boolean;
  initialMessage: string | null;
  /** Texto del asistente precargado (evita POST /api/chat en el primer turno). */
  initialPresetAssistant: string | null;
  initialTurnEpoch: number;
  /** Evita doble schedule del delay del preset (p. ej. Strict Mode en dev). */
  presetDelayActive: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openWithMessage: (msg: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  initialMessage: null,
  initialPresetAssistant: null,
  initialTurnEpoch: 0,
  presetDelayActive: false,
  open: () => set({ isOpen: true }),
  close: () =>
    set((s) => ({
      isOpen: false,
      initialMessage: null,
      initialPresetAssistant: null,
      initialTurnEpoch: s.initialTurnEpoch + 1,
      presetDelayActive: false,
    })),
  toggle: () =>
    set((s) => {
      const next = !s.isOpen;
      return next
        ? { isOpen: true }
        : {
            isOpen: false,
            initialMessage: null,
            initialPresetAssistant: null,
            initialTurnEpoch: s.initialTurnEpoch + 1,
            presetDelayActive: false,
          };
    }),
  openWithMessage: (msg: string) =>
    set((s) => ({
      isOpen: true,
      initialMessage: msg,
      initialPresetAssistant: tryBuildPresetAssistantText(msg),
      initialTurnEpoch: s.initialTurnEpoch + 1,
      presetDelayActive: false,
    })),
}));
