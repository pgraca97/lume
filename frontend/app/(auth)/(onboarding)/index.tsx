import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/src/components/typography/Text';
import { Button } from '@/src/components/form/Button';
import { tokens } from '@/src/theme/tokens';
import { useUserStore } from '@/src/stores/useUserStore';

export default function OnboardingWelcome() {
  const user = useUserStore((state) => state.user);

  const startOnboarding = () => {
   /*  router.push('/(onboarding)/profile'); */
  };

  return (
    <View style={styles.container}>
{/*       <Image
        source={require('@/assets/images/onboarding-welcome.png')}
        style={styles.image}
      /> */}

      <View style={styles.content}>
        <Text variant="h1" style={styles.title}>
          dfsfgfdssffsgfds
        </Text>
        
        <Text variant="body" style={styles.description}>
          Let's personalize your experience, {user?.email?.split('@')[0]}!
          We'll help you discover recipes that match your taste and lifestyle.
        </Text>

        <Button
          title="Get Started"
          onPress={startOnboarding}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  image: {
    width: '100%',
    height: '50%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: tokens.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  description: {
    textAlign: 'center',
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xl,
  },
  button: {
    width: '100%',
  },
});