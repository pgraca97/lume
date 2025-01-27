import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CURRENT_USER,
  CREATE_USER,
  UPDATE_PROFILE,
  GET_USER_BY_ID,
  GET_USER_BY_EMAIL,
  GET_USER_ID_BY_EMAIL,
} from "../graphql/operations/user";
import { useCallback } from "react";
import { apolloClient } from "@/src/config/apollo";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useUser = () => {
  // Queries
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refreshUser,
  } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [createUserMutation] = useMutation(CREATE_USER);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  // Cache management
  const updateLocalCache = useCallback(async (user: any) => {
    try {
      await AsyncStorage.setItem(
        "@user_cache",
        JSON.stringify({
          data: user,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error updating user cache:", error);
    }
  }, []);

  // Create user
  const createUser = async (email: string) => {
    try {
      const { data } = await createUserMutation({
        variables: { email },
      });

      if (data?.createUser) {
        // Atualizar o Zustand store
        setUser({
          id: data.createUser.id,
          email: data.createUser.email,
          firebaseUid: data.createUser.firebaseUid,
          onboarding: data.createUser.onboarding,
          profile: data.createUser.profile,
        });
      }

      return data?.createUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  // Fetch user by ID
  const fetchUserById = async (id: string) => {
    try {
      console.log("Fetching user by ID:", id); // Debugging

      const { data } = await apolloClient.query({
        query: GET_USER_BY_ID,
        variables: { id },
        fetchPolicy: "network-only", // Always fetch fresh data
      });

      console.log("Fetched user by ID:", data?.user); // Debugging
      return data?.user || null;
    } catch (error) {
      // Narrow down the type of the error
      if (error instanceof Error) {
        console.error("Error fetching user by ID:", {
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("Unknown error:", error);
      }
      return null;
    }
  };

  // Fetch user by email
  const fetchUserByEmail = async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Fetching user by email:", normalizedEmail); // Debugging

      const { data } = await apolloClient.query({
        query: GET_USER_BY_EMAIL,
        variables: { email: normalizedEmail },
        fetchPolicy: "network-only", // Always fetch fresh data
      });

      console.log("Fetched user by email:", data?.fetchUserByEmail); // Debugging
      if (!data?.fetchUserByEmail) {
        throw new Error("User not found");
      }
      return data.fetchUserByEmail;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  const fetchUserIdByEmail = async (email: string): Promise<string> => {
    try {
      // Normalize the email to lowercase for consistency
      const normalizedEmail = email.trim().toLowerCase();

      // Execute the GraphQL query
      const { data } = await apolloClient.query({
        query: GET_USER_ID_BY_EMAIL,
        variables: { email: normalizedEmail },
        fetchPolicy: "network-only", // Always fetch fresh data
      });

      // Check if the user was found
      if (!data?.fetchUserByEmail?.id) {
        throw new Error("User not found");
      }

      // Return the user ID
      return data.fetchUserByEmail.id;
    } catch (error) {
      console.error("Error fetching user ID by email:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };
  return {
    user: userData?.me,
    loading: userLoading,
    error: userError,
    refreshUser,
    createUser,
    updateProfile,
    fetchUserById,
    fetchUserByEmail,
    fetchUserIdByEmail,
  };
};
