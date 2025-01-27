import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/src/components/form/Button';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';

export default function SousChefScreen() {
  const handleNext = () => {
    router.push('/(auth)/(welcome)/dinners');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>
          No dinner ideas?
        </Text>

        <Text variant="h1" style={styles.title}>
          Meet Caldinho!
        </Text>

{/*         <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/chef-normal.png')}
            style={styles.chefImage}
            resizeMode="contain"
          />
          <Image
            source={require('@/assets/images/chef-wink.png')}
            style={[styles.chefImage, styles.chefOverlay]}
            resizeMode="contain"
          />
        </View> */}

        <Text style={styles.description}>
          Your personal sous-chef that transforms{'\n'}
          random ingredients into recipes{'\n'}
          that never fail!
        </Text>

        <Text style={styles.tip}>
          How not to burn that cake?
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
/*     backgroundColor: tokens.colors.warning.light,
    color: tokens.colors.warning.dark, */
    padding: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.fontSize.sm,
    marginBottom: tokens.spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
  },
  imageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    marginBottom: tokens.spacing.xl,
  },
  chefImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  chefOverlay: {
    opacity: 0,
  },
  description: {
    textAlign: 'center',
    fontSize: tokens.fontSize.lg,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.lg,
    lineHeight: tokens.lineHeight.relaxed,
  },
  tip: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.primary[300],
    marginBottom: tokens.spacing.xxl,
    fontStyle: 'italic',
  },
  button: {
    width: '100%',
  },
});