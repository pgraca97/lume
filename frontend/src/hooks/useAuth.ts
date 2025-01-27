// src/hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { AuthError } from '@/src/types/auth';
import { LoginInputs } from '../utils/auth';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useErrorHandler } from './useErrorHandler';
import { CREATE_USER } from '@/src/graphql/operations/user';
import { apolloClient } from '@/src/config/apollo';
import { useUserStore } from '../stores/useUserStore';
import { useAuthStatusStore } from '@/src/stores/useAuthStatusStore';
import { set } from 'zod';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  
  const { 
    createFirebaseUser, 
    signInWithFirebase,
    signOutFromFirebase,
    sendVerificationEmail,
    deleteFirebaseUser 
  } = useFirebaseAuth();

  const { error, handleAuthError, clearError } = useErrorHandler();
  
  // GraphQL mutation for creating user
  const [createUserMutation] = useMutation(CREATE_USER);

  const signUp = useCallback(async (data: LoginInputs) => {
    const { setIsRegistering } = useAuthStatusStore.getState();
    setLoading(true);
    clearError();
    let firebaseUser = null;
  
    try {
      setIsRegistering(true);
      firebaseUser = await createFirebaseUser(data);
      
      const { data: userData } = await createUserMutation({
        variables: {
          input: {
            firebaseUid: firebaseUser.uid,
            email: data.email
          }
        }
      });
  
      if (!userData?.createUser) {
        throw new Error('Failed to create user profile');
      }
  
      // Send verification email
      await sendVerificationEmail(firebaseUser);
  
      // Limpar estado e fazer logout
      await apolloClient.clearStore();
      await signOutFromFirebase();
      setUser(null);
  
      return firebaseUser;
    } catch (err) {
      if (firebaseUser) {
        await deleteFirebaseUser(firebaseUser);
        await apolloClient.resetStore();
      }
      handleAuthError(err);
      throw err;
    } finally {
      setLoading(false);
      setIsRegistering(false);
    }
  }, [createUserMutation]);


const signIn = useCallback(async (data: LoginInputs) => {
  const { isRegistering } = useAuthStatusStore.getState();
  setLoading(true);
  clearError();

  try {
    console.log(isRegistering + ' ' + '??????????????????')
    console.log('[Auth] Starting login process');
    

    const firebaseUser = await signInWithFirebase(data);
    
    if (!firebaseUser) {
      throw new Error('Firebase login failed - no user returned');
    }

    const token = await firebaseUser.getIdToken(true);
    
    await apolloClient.reFetchObservableQueries();
    

    console.log('[Auth] Login and setup complete');
    return firebaseUser;
  } catch (err: any) {
    console.error('[Auth] Login failed:', err);
    handleAuthError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  const signOut = useCallback(async () => {
    try {
      // First clear Apollo cache and stop all active queries
      await apolloClient.clearStore(); // This won't trigger refetches like resetStore()
      
      // Then sign out from Firebase
      await signOutFromFirebase();
      
    } catch (err: any) {
      handleAuthError(err);
      throw err;
    }
  }, []);

  return {
    signUp,
    signIn,
    signOut,
    loading,
    error
  };
};