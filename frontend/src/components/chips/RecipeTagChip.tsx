import { tokens } from "@/src/theme/tokens";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

interface TagProps {
  name: string;
  category: string;
}

const categoryColors = {
  MOMENT: "#f7ea6f",
  METHOD: "#b56857",
  LIFESTYLE: "#2f5223",
  CONVENIENCE: "#c4fff5",
  BUDGET: "#9ff582",
  OCCASION: "#751a26",
  SEASONAL: "#4d1d12",
  SPECIAL: "#f59700",
};

export default function MyRecipeTagChip({ name, category }: TagProps) {
  const categoryColor = categoryColors[category] || tokens.colors.gray[300];
  const backgroundCategoryColor = categoryColor + 20;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundCategoryColor },
        { borderColor: categoryColor },
      ]}
    >
      <Text style={[styles.title]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: tokens.borderRadius.full,
    padding: 10,
    flexWrap: "wrap",
    marginBottom: 10,

    marginRight: 15,
    borderWidth: 2,
  },
  title: {
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    color: "black",
  },
});
