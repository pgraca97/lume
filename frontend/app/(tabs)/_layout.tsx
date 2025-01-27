// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import {
  Home,
  Search,
  CalendarDays,
  User,
  CookingPot,
  BookMarked,
  ChefHat,
} from "lucide-react-native";
import { View, Text } from "react-native";

export default function TabsLayout() {
  return (
    <>

    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF6B6B",
        tabBarInactiveTintColor: "#4A5568",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "For You",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <CookingPot size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: "Cookbook",
          tabBarIcon: ({ color }) => <BookMarked size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prepstation"
        options={{
          title: "Prep Station",
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}
