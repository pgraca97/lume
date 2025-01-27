import { View, Text, StyleSheet, TouchableHighlight } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { useUser } from "@/src/hooks/useUser";
import { Button } from "@/src/components/form/Button";
import { tokens } from "@/src/theme/tokens";
import { BotMessageSquare } from "lucide-react-native";
import React from "react";

export default function Chat() {
  const { user } = useUser();

  const router = useRouter();

  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: tokens.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.gray[200],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  welcome: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
