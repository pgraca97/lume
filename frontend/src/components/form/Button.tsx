// src/components/form/Button.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text } from '../typography/Text';
import { tokens } from '@/src/theme/tokens';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  titleStyle?: object; 
}

export const Button = ({
  title,
  loading,
  variant = 'primary',
  size = 'md',
  style,
  titleStyle,
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? tokens.colors.primary[500] : 'white'} 
        />
      ) : (
        <Text 
          variant="body"
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            titleStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};


Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: tokens.colors.primary[500],
  },
  secondary: {
    backgroundColor: tokens.colors.gray[200],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.primary[500],
  },
  textText: {
    color: tokens.colors.primary[500],
  },
  disabled: {
    opacity: 0.5,
  },
  sm: {
    height: 36,
    paddingHorizontal: tokens.spacing.md,
  },
  md: {
    height: 48,
    paddingHorizontal: tokens.spacing.lg,
  },
  lg: {
    height: 56,
    paddingHorizontal: tokens.spacing.xl,
  },
  text: {
    fontWeight: tokens.fontWeight.semibold,
  },
  primaryText: {
    color: tokens.colors.text.inverse,
  },
  secondaryText: {
    color: tokens.colors.text.primary,
  },
  outlineText: {
    color: tokens.colors.primary[500],
  },
  smText: {
    fontSize: tokens.fontSize.sm,
  },
  mdText: {
    fontSize: tokens.fontSize.md,
  },
  lgText: {
    fontSize: tokens.fontSize.lg,
  },
});