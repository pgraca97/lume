// app/_layout.tsx
import { useEffect, useState } from "react";
import { Stack, useSegments } from "expo-router";
import auth, { firebase, FirebaseAuthTypes } from "@react-native-firebase/auth";
import { View, ActivityIndicator } from "react-native";
import { ApolloProvider, useQuery } from "@apollo/client";
import { apolloClient } from "@/src/config/apollo";
import { tokens } from "@/src/theme/tokens";
import { useUserStore } from "@/src/stores/useUserStore";
import { useNavigationFlow } from "@/src/hooks/useNavigationFlow";
import { GET_CURRENT_USER } from "@/src/graphql/operations/user";
import { LoadingScreen } from "@/src/components/feedback/LoadingScreen";
import { useAuthStatusStore } from "@/src/stores/useAuthStatusStore";
import { useSplashStore } from "@/src/stores/useSplashStore";

interface AuthStateManagerProps {
  children: React.ReactNode;
}

function AuthStateManager({ children }: AuthStateManagerProps) {
  const [initializing, setInitializing] = useState(true);
  const { isCompleted: isSplashCompleted } = useSplashStore();
  const { isRegistering } = useAuthStatusStore();
  const setUser = useUserStore((state) => state.setUser);
  const [firebaseUser, setFirebaseUser] =
    useState<FirebaseAuthTypes.User | null>(null);
  const user = useUserStore((state) => state.user);


  
  const { checkAndNavigate } = useNavigationFlow();

  // Skip query during registration or when no Firebase user
  const { data, loading, refetch } = useQuery(GET_CURRENT_USER, {
    skip: !firebaseUser || isRegistering,
    fetchPolicy: "no-cache",
    onError: (error) => {
      console.error("[AuthState] Query error:", error);
    },
  });

  // Handle Firebase auth state
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      console.log("[AuthState] Auth state changed:", user?.uid);

      // Don't set Firebase user if in registration process
      if (!isRegistering) {
        console.log(
          "[AuthState] Setting Firebase user:",
          user?.uid + "aaaaaaaaaaaaaaaaaaaaaa"
        );
        setFirebaseUser(user);
      }
      
      if (!user) {
        console.log("[AuthState] No user - clearing store");
        setUser(null);
      }

      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [isRegistering]);

  // Sync user data effect
  useEffect(() => {
    const firebaseUser = auth().currentUser;
    console.log("[AuthState] Firebase user:", firebaseUser?.uid);
    if (data?.me && firebaseUser) {
      console.log("[AuthState] Setting user data:", {
        uid: firebaseUser.uid,
        apiId: data.me.id,
      });

      setUser({
        id: data.me.id,
        email: data.me.email,
        firebaseUid: firebaseUser.uid,
        welcomeFlow: data.me.welcomeFlow,
        onboarding: data.me.onboarding,
        profile: data.me.profile,
      });
    }
  }, [data]);

  // Navigation effect
  // Update this effect
  useEffect(() => {
    if (!initializing && !loading && isSplashCompleted) {
      console.log("[AuthState] Ready for navigation:", {
        initializing,
        loading,
        hasUser: !!auth().currentUser,
        hasData: !!data?.me,
        hasStoreUser: !!useUserStore.getState().user,
        splashCompleted: isSplashCompleted
      });
      checkAndNavigate();
    }
  }, [initializing, loading, data, user, isSplashCompleted]); 
  if (initializing || loading) return <LoadingScreen />;

  return children;
}

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthStateManager>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="intro" options={{ headerShown: false }} />

          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat"
            options={{
              headerTitle: "Caldinho",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              headerTitle: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="recipes/[id]"
            options={{
              headerTransparent: true,
              headerTintColor: tokens.colors.primary[500],
              headerTitle: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="step-by-step/[id]"
            options={{
              headerTransparent: true,
              headerTintColor: tokens.colors.primary[500],
              headerTitle: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="reviews/[id]"
            options={{
              headerTransparent: true,
              headerTintColor: tokens.colors.primary[500],
              headerTitle: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="note/[id]"
            options={{
              headerTransparent: true,
              headerTintColor: tokens.colors.primary[500],
              headerTitle: "",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="table/[id]"
            options={{
              headerTransparent: true,
              headerTintColor: tokens.colors.primary[500],
              headerTitle: "",
              headerShown: true,
            }}
          />
        </Stack>
      </AuthStateManager>
    </ApolloProvider>
  );
}

