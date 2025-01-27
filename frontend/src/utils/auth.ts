// src/utils/auth.ts
import { z } from 'zod';

// Base schema for reuse
const baseAuthSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
});

export const loginSchema = baseAuthSchema;

export const registerSchema = baseAuthSchema.extend({
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
);

// Type inference
export type LoginInputs = z.infer<typeof loginSchema>;
export type RegisterInputs = z.infer<typeof registerSchema>;

// Firebase error mapping
export const mapFirebaseError = (code: string): string => {
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email format',
    'auth/weak-password': 'Password is too weak',
    'auth/wrong-password': 'Invalid email or password',
    'auth/user-not-found': 'No account found with this email',
    'auth/invalid-credentials': 'Invalid email or password',
    'auth/network-request-failed': 'Network error - please check your connection',
    'auth/too-many-requests': 'Too many attempts - please try again later',
    'auth/operation-not-allowed': 'This login method is not enabled',
    'default': 'An error occurred during authentication'
  };

  return errorMap[code] || errorMap.default;
};