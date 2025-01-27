// src/components/form/Form.tsx
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { tokens } from '@/src/theme/tokens';

export const Form= ({ children, style, ...props }: ViewProps) => {
  return (
    <View style={[styles.form, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    width: '100%',
    padding: tokens.spacing.lg,
  },
});