import { Stack } from 'expo-router';
import { tokens } from '@/src/theme/tokens';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: tokens.colors.background.primary
        }
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Welcome',
        }} 
      />
    {/*   <Stack.Screen 
        name="profile" 
        options={{
          title: 'Your Profile',
        }} 
      />
      <Stack.Screen 
        name="experience" 
        options={{
          title: 'Experience',
        }} 
      />
      <Stack.Screen 
        name="dietary" 
        options={{
          title: 'Dietary',
        }} 
      />
      <Stack.Screen 
        name="preferences" 
        options={{
          title: 'Preferences',
        }} 
      /> */}
    </Stack>
  );
}