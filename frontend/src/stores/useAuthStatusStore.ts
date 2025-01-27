// src/stores/useAuthStatusStore.ts
import { create } from 'zustand';

interface AuthStatusState {
  isRegistering: boolean;
  setIsRegistering: (status: boolean) => void;
}

export const useAuthStatusStore = create<AuthStatusState>((set) => ({
  isRegistering: false,
  setIsRegistering: (status) => set({ isRegistering: status }),
}));