// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { ApolloError } from '@apollo/client';
import { mapFirebaseError } from '@/src/utils/auth';
import { isGraphQLError } from '@/src/types/auth';

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleAuthError = useCallback((err: any): string => {
    let message: string;
    
    if (isGraphQLError(err)) {
      // Handle GraphQL errors
      message = err.graphQLErrors[0]?.message || 'An error occurred';
    } else {
      // Handle Firebase/other errors
      message = mapFirebaseError(err.code);
    }
    
    setError(message);
    return message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleAuthError, clearError };
};