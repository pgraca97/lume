import { Stack } from 'expo-router';
import { tokens } from '@/src/theme/tokens';

export default function WelcomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: tokens.colors.background.primary
        },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="sousChef" />
{/*       <Stack.Screen name="dinners" /> */}
{/*       <Stack.Screen 
        name="final" 
        options={{
          gestureEnabled: false
        }}
      /> */}
    </Stack>
  );
}