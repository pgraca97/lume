import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { AuthForm } from '@/src/components/form/AuthForm';
import { RegisterInputs } from '@/src/utils/auth';
import { Text } from '@/src/components/typography/Text';
import { tokens } from '@/src/theme/tokens';

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (data: RegisterInputs) => {
    try {
      setError(null);
      await signUp(data);
    // Force navigation to intro after successful registration
    router.replace("/intro");
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <>
      {error && (
        <Text style={{ 
          color: tokens.colors.error.default,
          textAlign: 'center',
          marginBottom: tokens.spacing.md 
        }}>
          {error}
        </Text>
      )}

      <AuthForm
        type="register"
        loading={loading}
        onSubmit={handleSubmit}
        onToggleForm={() => router.push('/(auth)/login')}
      />
    </>
  );
}