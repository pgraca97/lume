// app/(auth)/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Header } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { tokens } from "@/src/theme/tokens";
import { TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";

export default function AuthLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        header: (props: NativeStackHeaderProps) => (
          <Header
            {...props}
            headerLeft={({ canGoBack }) => 
              canGoBack ? (
                <TouchableOpacity
                  onPress={() => router.replace("/intro")}
                  style={{
                    padding: tokens.spacing.sm,
                    marginLeft: tokens.spacing.md,
                  }}
                >
                  <ChevronLeft size={24} color={tokens.colors.primary[600]} />
                </TouchableOpacity>
              ) : null
            }
            title="" 
            headerStyle={{
              backgroundColor: 'transparent',
            }}
            headerShadowVisible={false}
          />
        ),
      }}
    >
      {/* Authentication screens with custom header */}
      <Stack.Screen 
        name="login" 
        options={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen 
        name="register" 
        options={{
          headerTransparent: true,
        }}
      />

      {/* Welcome flow screens - no header needed */}
      <Stack.Screen 
        name="(welcome)" 
        options={{
          headerShown: false,
        }}
      />

      {/* Onboarding flow screens - no header needed */}
      <Stack.Screen 
        name="(onboarding)" 
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back during onboarding
        }}
      />
    </Stack>
  );
}