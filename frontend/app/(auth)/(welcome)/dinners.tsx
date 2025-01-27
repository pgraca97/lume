import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/src/components/form/Button';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';

export default function DinnersScreen() {
  const handleNext = () => {
    // After this, we'll start the onboarding process
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>
          Assigned tasks and planned the menu
        </Text>

        <Text variant="h1" style={styles.title}>
          Join the party!
        </Text>

{/*         <Image
          source={require('@/assets/images/dinner-table.png')}
          style={styles.image}
          resizeMode="contain"
        /> */}

        <Text style={styles.description}>
          Organize group dinners stress-free:{'\n'}
          divide tasks, plan menus and{'\n'}
          impress everyone
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Rate Recipes"
            variant="outline"
            style={styles.rateButton}
          />

          <Button
            title="Start Cooking"
            onPress={handleNext}
            style={styles.startButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: tokens.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: tokens.colors.success.light,
    color: tokens.colors.success.dark,
    padding: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.fontSize.sm,
    marginBottom: tokens.spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  image: {
    width: '100%',
    height: 250,
    marginBottom: tokens.spacing.xl,
  },
  description: {
    textAlign: 'center',
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xxl,
    lineHeight: tokens.lineHeight.relaxed,
  },
  buttonContainer: {
    width: '100%',
    gap: tokens.spacing.md,
  },
  rateButton: {
    width: '100%',
  },
  startButton: {
    width: '100%',
  },
});