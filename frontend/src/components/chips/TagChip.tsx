import { tokens } from "@/src/theme/tokens";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

// define valid category types
export type CategoryType = "MOMENT" | "METHOD" | "LIFESTYLE" | "CONVENIENCE" | 
                   "BUDGET" | "OCCASION" | "SEASONAL" | "SPECIAL";

interface TagProps {
  name: string;
  category: CategoryType;
  onPress: () => void;
  isSelected: boolean;
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
} as const;

// type gard validation
const isValidCategory = (category: string): category is CategoryType => {
  return Object.keys(categoryColors).includes(category);
}

export default function MyTagChip({
  name,
  category,
  onPress,
  isSelected,
}: TagProps) {

  // safe color access with type checking
  const categoryColor = isValidCategory(category) ? categoryColors[category] : tokens.colors.gray[300];


  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, isSelected && styles.selected]}
    >
      <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]} />
      <Text style={styles.title}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.borderRadius.full,
    padding: 10,
    height: 50,
    marginBottom: 10,
    elevation: 2,
    marginRight: 15,
  },
  selected: {
    backgroundColor: tokens.colors.primary[200], // Highlight the selected tag
    borderWidth: 2,
    borderColor: tokens.colors.primary[500],
  },
  categoryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  title: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    color: "black",
  },
});
