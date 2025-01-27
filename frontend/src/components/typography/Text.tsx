// src/components/typography/Text.tsx
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { tokens } from '@/src/theme/tokens';

interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export const Text = ({
  variant = 'body',
  style,
  children,
  ...props
}: CustomTextProps) => {
  return (
    <RNText style={[styles[variant], style]} {...props}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontSize: tokens.fontSize.xxxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  h2: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  h3: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  body: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.normal,
    color: tokens.colors.text.primary,
  },
  caption: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
});