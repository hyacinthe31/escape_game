import { create } from "zustand";
import { Organ, organs } from "./gameLogic";

type GameState = {
  currentOrgan: Organ;
  timeLeft: number;
  setOrgan: (organ: Organ) => void;
  decrementTime: () => void;
  reset: () => void;
};

export const useGameStore = create<GameState>((set) => ({
  currentOrgan: "brain",
  timeLeft: 900, // 15 minutes
  setOrgan: (organ) => set({ currentOrgan: organ }),
  decrementTime: () => set((state) => ({ timeLeft: state.timeLeft - 1 })),
  reset: () => set({ currentOrgan: "brain", timeLeft: 900 }),
}));
