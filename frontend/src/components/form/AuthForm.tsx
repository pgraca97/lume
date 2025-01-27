// src/components/auth/AuthForm.tsx
import React from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInputs, RegisterInputs } from '@/src/utils/auth';
import { loginSchema, registerSchema } from '@/src/utils/auth';
import { Form } from '@/src/components/form/Form';
import { Input } from '@/src/components/form/Input';
import { Button } from '@/src/components/form/Button';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';
import { useHeaderHeight } from '@react-navigation/elements';

// Define separate interfaces for login and register
interface AuthFormLoginProps {
  type: 'login';
  loading: boolean;
  onSubmit: (data: LoginInputs) => Promise<void>;
  onToggleForm: () => void;
}

interface AuthFormRegisterProps {
  type: 'register';
  loading: boolean;
  onSubmit: (data: RegisterInputs) => Promise<void>;
  onToggleForm: () => void;
}

// Union of types
type AuthFormProps = AuthFormLoginProps | AuthFormRegisterProps;

export const AuthForm = ({ 
  type, 
  loading, 
  onSubmit, 
  onToggleForm 
}: AuthFormProps) => {
  const isLogin = type === 'login';
  const schema = isLogin ? loginSchema : registerSchema;
  const headerHeight = useHeaderHeight();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      ...(isLogin ? {} : { confirmPassword: '' })
    }
  });

  // Helper function to ensure the correct type
  const handleFormSubmit = (data: LoginInputs | RegisterInputs) => {
    if (isLogin) {
      onSubmit(data as LoginInputs);
    } else {
      onSubmit(data as RegisterInputs);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
       <Form style={{ paddingTop: headerHeight }}> 
        <View style={styles.logoContainer}>
          <Text variant="h1" style={styles.logo}>Lume</Text>
        </View>

        <Text variant="h2" style={styles.title}>
          {isLogin ? 'Welcome back!' : 'Create Account'}
        </Text>
        
        <Text variant="body" style={styles.subtitle}>
          {isLogin 
            ? 'Sign in to your account to continue'
            : 'Join Lume to start your culinary journey'
          }
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              containerStyle={styles.inputContainer}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Password"
              placeholder={isLogin ? "Enter your password" : "Create a password"}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              returnKeyType={isLogin ? "done" : "next"}
              containerStyle={styles.inputContainer}
            />
          )}
        />

        {!isLogin && (
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                secureTextEntry
                returnKeyType="done"
                containerStyle={styles.inputContainer}
              />
            )}
          />
        )}

        <Button
          title={isLogin ? "Sign In" : "Create Account"}
          onPress={handleSubmit(handleFormSubmit)}
          loading={loading}
          style={styles.submitButton}
          size="lg"
        />

        <View style={styles.footer}>
          <Text variant="body">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Button
            title={isLogin ? "Create Account" : "Sign In"}
            variant="outline"
            onPress={onToggleForm}
          />
        </View>
      </Form>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  logo: {
    color: tokens.colors.primary[500],
  },
  title: {
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xl,
  },
  inputContainer: {
    marginBottom: tokens.spacing.lg,
  },
  submitButton: {
    marginTop: tokens.spacing.md,
  },
  footer: {
    marginTop: tokens.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});