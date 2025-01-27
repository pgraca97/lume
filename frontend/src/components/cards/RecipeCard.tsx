import { tokens } from "@/src/theme/tokens";
import { Link } from "expo-router";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { BookmarkPlus } from "lucide-react-native";
import React, { useState } from "react";
import AddToCollectionModal from "@/src/components/modal/AddRecipeTableModal";
import { useTable } from "@/src/hooks/useTable";
import { Alert } from "react-native";

export default function MyRecipeCard(props: RecipeProps) {
  const [isModalVisible, setModalVisible] = useState(false); // State to control modal visibility

  const {
    tables,
    addRecipeToTable,
    refresh: { tables: refreshMyTables },
  } = useTable();

  const handleAddToTable = async (tableId: string, recipeId: string) => {
    try {
      // Attempt to add the recipe to the table
      await addRecipeToTable(tableId, recipeId);

      // Show success alert
      Alert.alert(
        "Success",
        "The recipe was added to your table successfully."
      );
    } catch (error: any) {
      console.error("Error adding recipe to table:", error);
      Alert.alert("Attention", "This table already has this recipe.");
    }
  };

  const difficultyArray = Array(4)
    .fill(0)
    .map((_, index) => index + 1);

  return (
    <View>
      <Link
        href={{ pathname: "/recipes/[id]", params: { id: props.id } }}
        style={styles.container}
      >
        <View>
          <Image
            source={{ uri: props.mainImage }}
            style={styles.image}
            key={props.id}
          />
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {props.title}
          </Text>
          <Text style={styles.subtitle}>{props.subtitle}</Text>
          <Text style={styles.cost}>{props.costPerServing}€/serving</Text>
          <View style={styles.infoContainer}>
            <View style={styles.difficultyContainer}>
              {difficultyArray.map((level) => (
                <View
                  key={level}
                  style={[
                    styles.ball,
                    level <= props.difficulty
                      ? styles.activeBall
                      : styles.inactiveBall,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.time}>{props.totalTime} min</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <BookmarkPlus size={32} color={tokens.colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </Link>

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        tables={tables}
        recipeId={props.id}
        onAddToTable={handleAddToTable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.primary[50],
    borderRadius: 8,
    padding: 10,
    width: Dimensions.get("window").width - 165,
    height: 300,
    margin: 7,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: "55%",
    borderRadius: 4,
  },
  title: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    color: "black",
    marginTop: 5,
    textAlign: "left",
    overflow: "hidden",
  },
  subtitle: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  cost: {
    paddingTop: tokens.spacing.sm,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.primary[500],
    fontWeight: tokens.fontWeight.medium,
  },
  infoContainer: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    marginTop: tokens.spacing.sm,
  },
  difficultyContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 20,
  },
  ball: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  activeBall: {
    backgroundColor: tokens.colors.primary[500],
  },
  inactiveBall: {
    backgroundColor: tokens.colors.gray[300],
  },
  time: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    paddingRight: 40,
  },
});
