// src/hooks/useFirebaseAuth.ts
import { useCallback } from 'react';
import auth from '@react-native-firebase/auth';
import { LoginInputs } from '../utils/auth';

export const useFirebaseAuth = () => {
  const createFirebaseUser = useCallback(async ({ email, password }: LoginInputs) => {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  }, []);

  const signInWithFirebase = useCallback(async ({ email, password }: LoginInputs) => {
    try {
      // Attempt login directly
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error('[Auth] Login error:', {
        code: error.code,
        message: error.message
      });
      throw error;
    }
  }, []);

  const signOutFromFirebase = useCallback(async () => {
    await auth().signOut();
  }, []);

  const sendVerificationEmail = useCallback(async (user: any) => {
    await user.sendEmailVerification();
  }, []);

  const deleteFirebaseUser = useCallback(async (user: any) => {
    await user.delete();
  }, []);

  return {
    createFirebaseUser,
    signInWithFirebase,
    signOutFromFirebase,
    sendVerificationEmail,
    deleteFirebaseUser
  };
};