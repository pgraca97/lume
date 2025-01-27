import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '@/src/stores/useUserStore';
import auth from '@react-native-firebase/auth';

export const useNavigationFlow = () => {
  const user = useUserStore((state) => state.user);
  const isFirstLaunch = useUserStore((state) => state.isFirstLaunch);

  const determineUserState = () => {
    // Check Firebase auth first
    const firebaseUser = auth().currentUser;
    
    if (!firebaseUser) {
      console.log('[Navigation] No Firebase user - redirecting to INTRO');
      return 'INTRO';
    }

    if (!user) {
      console.log('[Navigation] No store user data - redirecting to INTRO');
      return 'INTRO';
    }

    // Welcome flow check
    if (!user.welcomeFlow?.isCompleted) {
      console.log('[Navigation] Welcome flow incomplete - redirecting to WELCOME');
      return 'WELCOME';
    }

    // Onboarding check
    if (!user.onboarding?.isCompleted) {
      console.log('[Navigation] Onboarding incomplete - redirecting to ONBOARDING');
      return 'ONBOARDING';
    }

    console.log('[Navigation] All flows complete - redirecting to TABS');
    return 'COMPLETED';
  };

  const navigateBasedOnState = (state: string) => {
    console.log(`[Navigation] Navigating to state: ${state}`);
    
    switch (state) {
      case 'INTRO':
        router.replace('/intro');
        break;
      case 'WELCOME':
        router.replace('/(auth)/(welcome)');
        break;
      case 'ONBOARDING':
        router.replace('/(auth)/(onboarding)');
        break;
      case 'COMPLETED':
        router.replace('/(tabs)');
        break;
    }
  };

  return {
    checkAndNavigate: () => {
      const state = determineUserState();
      navigateBasedOnState(state);
    }
  };
};