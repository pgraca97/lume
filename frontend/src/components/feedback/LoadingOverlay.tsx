// src/components/feedback/LoadingOverlay.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '../typography/Text';
import { tokens } from '@/src/theme/tokens';
interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({ 
  message = 'Loading...' 
}: LoadingOverlayProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  content: {
    backgroundColor: tokens.colors.background.primary,
    padding: tokens.spacing.xl,
    borderRadius: tokens.borderRadius.lg,
    alignItems: 'center',
    ...tokens.shadows.lg,
  },
  message: {
    marginTop: tokens.spacing.md,
    color: tokens.colors.text.secondary,
  },
});