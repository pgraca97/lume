// app/index.tsx
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { TamaguiProvider, createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';
import { CustomSplashScreen } from '@/src/components/SplashScreen';

const tamaguiConfig = createTamagui(config);

SplashScreen.preventAutoHideAsync();

export default function Initial() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig}>
      <CustomSplashScreen />
    </TamaguiProvider>
  );
}
