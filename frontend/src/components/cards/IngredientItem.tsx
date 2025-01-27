import { tokens } from "@/src/theme/tokens";
import { Link } from "expo-router";
import { View, StyleSheet, Image, Text, Dimensions } from "react-native";
import { Checkbox } from "react-native-paper";

import { PencilLine } from "lucide-react";

import { BookMarked, BookmarkPlus } from "lucide-react-native";
import { useEffect, useState } from "react";

interface IngredientProps {
  name: string;
  amount?: string;
  unit?: string;
}

export default function MyIngredientItem(props: IngredientProps) {
  const [isSelected, setSelection] = useState(false);

  return (
    <View style={styles.container}>
      <View>
        <Checkbox
          status={isSelected ? "checked" : "unchecked"}
          onPress={() => setSelection(!isSelected)}
          color={tokens.colors.primary[500]} // Customize the color
        />
      </View>
      <Text style={styles.ingredientInfo}>
        {props.amount &&
          `${parseFloat(props.amount)
            .toFixed(2)
            .replace(/[.,]00$/, "")} `}
        {props.unit && `${props.unit} `}
        {props.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.primary[50],
    borderRadius: 8, // Adds rounded corners
    padding: 10,
    width: Dimensions.get("window").width - 40, // Parent will handle layout width
    alignContent: "center",
    alignItems: "center",
    margin: 7,
    elevation: 2, // For Android shadow
    flexDirection: "row",
  },
  ingredientInfo: {
    fontSize: tokens.fontSize.md,
  },
  checkbox: {
    marginRight: 10,
  },
});
