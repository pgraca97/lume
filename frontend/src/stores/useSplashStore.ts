import { create } from 'zustand';

type SplashState = {
  isCompleted: boolean;
  complete: () => void;
};

export const useSplashStore = create<SplashState>((set) => ({
  isCompleted: false,
  complete: () => set({ isCompleted: true }),
}));