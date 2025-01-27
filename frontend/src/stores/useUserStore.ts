import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firebaseUid: string;
  welcomeFlow?: {
    isCompleted: boolean;
    completedAt?: Date;
  };
  onboarding?: {
    isCompleted: boolean;
    completedSteps: string[];
    completedAt?: Date;
  };
  profile?: {
    username?: string;
    bio?: string;
    profileImage?: string;
  };
}

interface UserState {
  user: User | null;
  isFirstLaunch: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setFirstLaunch: (value: boolean) => void;
  updateWelcomeFlow: (welcomeFlow: User['welcomeFlow']) => void;
  updateOnboarding: (onboarding: User['onboarding']) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isFirstLaunch: true,
      setUser: (user) => {
        console.log('[UserStore] Setting user:', user);
        set({ user })},
      clearUser: () => set({ user: null }),
      setFirstLaunch: (value) => set({ isFirstLaunch: value }),
      updateWelcomeFlow: (welcomeFlow) => 
        set((state) => ({
          user: state.user 
            ? { ...state.user, welcomeFlow }
            : null
        })),
      updateOnboarding: (onboarding) => 
        set((state) => ({
          user: state.user 
            ? { ...state.user, onboarding }
            : null
        })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
