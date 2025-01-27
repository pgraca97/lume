import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ShoppingBasket, Calendar, Layers, Award } from "lucide-react-native";
import { tokens } from "@/src/theme/tokens";

interface TopNavBarProps {
  onTabChange: (tab: string) => void;
}

export function TopNavBar({ onTabChange }: TopNavBarProps) {
  const [activeTab, setActiveTab] = useState<string>("basket");

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress("basket")}
      >
        <ShoppingBasket
          size={28}
          color={
            activeTab === "basket"
              ? tokens.colors.primary[500]
              : tokens.colors.gray[300]
          }
        />
        {activeTab === "basket" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress("calendar")}
      >
        <Calendar
          size={28}
          color={
            activeTab === "calendar"
              ? tokens.colors.primary[500]
              : tokens.colors.gray[300]
          }
        />
        {activeTab === "calendar" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress("collection")}
      >
        <Layers
          size={28}
          color={
            activeTab === "collection"
              ? tokens.colors.primary[500]
              : tokens.colors.gray[300]
          }
        />
        {activeTab === "collection" && (
          <View style={styles.activeIndicator} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleTabPress("badge")}
      >
        <Award
          size={28}
          color={
            activeTab === "badge"
              ? tokens.colors.primary[500]
              : tokens.colors.gray[300]
          }
        />
        {activeTab === "badge" && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
  },
  tabItem: {
    alignItems: "center",
  },
  activeIndicator: {
    marginTop: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.colors.primary[500],
  },
});