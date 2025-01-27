// src/types/auth.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public graphQLErrors?: readonly any[]
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Custom type guard to check if an error is AuthError
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

// Type guard for GraphQL errors - Used in error handling
// Helps TypeScript understand when an error is from GraphQL
export function isGraphQLError(error: unknown): error is {graphQLErrors: readonly any[]} {
  return typeof error === 'object' && 
         error !== null && 
         'graphQLErrors' in error && 
         Array.isArray((error as any).graphQLErrors);
}