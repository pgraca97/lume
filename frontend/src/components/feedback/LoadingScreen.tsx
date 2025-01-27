// src/components/feedback/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ 
  message = 'Loading...'
}: LoadingScreenProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={tokens.colors.primary[500]} 
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.primary,
  },
  message: {
    marginTop: tokens.spacing.md,
    color: tokens.colors.text.secondary,
    fontSize: tokens.fontSize.lg,
  },
});