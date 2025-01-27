import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/src/components/form/Button';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';

export default function WelcomeScreen() {
  const handleNext = () => {
    router.push('/(auth)/(welcome)/sousChef');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>
          From basics to 'master chef' without stress
        </Text>

        <Text variant="h1" style={styles.title}>
          Welcome to Lume
        </Text>

{/*         <Image
          source={require('@/assets/images/welcome-cooking.png')}
          style={styles.image}
          resizeMode="contain"
        /> */}

        <Text style={styles.description}>
          Discover recipes that adapt to your daily routine:{'\n'}
          From quick dinners to perfect date nights!
        </Text>

        <Text style={styles.subtitle}>
          Recipes tailored to your (in)genius!
        </Text>

        <Button
          title="Next"
          onPress={handleNext}
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
  content: {
    flex: 1,
    padding: tokens.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: tokens.colors.primary[100],
    color: tokens.colors.primary[500],
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
    marginBottom: tokens.spacing.lg,
    lineHeight: tokens.lineHeight.relaxed,
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.primary[500],
    marginBottom: tokens.spacing.xxl,
  },
  button: {
    width: '100%',
  },
});