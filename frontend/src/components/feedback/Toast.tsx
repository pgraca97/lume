// src/components/feedback/Toast.tsx
import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { tokens } from '@/src/theme/tokens';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  duration?: number;
}

export const Toast = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}: ToastProps) => {
  const translateY = new Animated.Value(-100);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.delay(duration),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose?.());
  }, []);

  const backgroundColor = {
    success: tokens.colors.success.default,
    error: tokens.colors.error.default,
    info: tokens.colors.primary[500],
  }[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], backgroundColor },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onClose}>
        <Text style={styles.closeButton}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...tokens.shadows.md,
  },
  message: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.fontSize.md,
    flex: 1,
  },
  closeButton: {
    color: tokens.colors.text.inverse,
    fontSize: tokens.fontSize.xl,
    marginLeft: tokens.spacing.sm,
  },
});