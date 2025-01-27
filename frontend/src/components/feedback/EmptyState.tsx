// src/components/feedback/EmptyState.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../typography/Text';
import { Button } from '../form/Button';
import { tokens } from '@/src/theme/tokens';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) => {
  return (
    <View style={[styles.container, style]}>
      <Text variant="h3" style={styles.title}>
        {title}
      </Text>
      {message && (
        <Text style={styles.message}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.action}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: tokens.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.lg,
  },
  action: {
    minWidth: 200,
  },
});