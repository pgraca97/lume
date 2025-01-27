// src/components/form/Input.tsx
import {forwardRef} from 'react';
import { 
  TextInput, 
  TextInputProps, 
  View, 
  Text, 
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { tokens } from '@/src/theme/tokens';

export interface InputProps extends TextInputProps {
  error?: string;
  label?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(({
  error,
  label,
  containerStyle,
  style,
  ...props
}, ref) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={tokens.colors.gray[400]}
        {...props}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
  },
  input: {
    height: 50,
    backgroundColor: tokens.colors.background.secondary,
    borderWidth: 1,
    borderColor: tokens.colors.gray[200],
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.primary,
  },
  inputError: {
    borderColor: tokens.colors.error.default,
  },
  errorText: {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.error.default,
    marginTop: tokens.spacing.xs,
  },
});