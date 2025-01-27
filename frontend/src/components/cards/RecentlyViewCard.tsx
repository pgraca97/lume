import { tokens } from "@/src/theme/tokens";
import { Link } from "expo-router";
import {
  View,
  StyleSheet,
  Image,
  Text,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { BookMarked, BookmarkPlus } from "lucide-react-native";
import { useEffect } from "react";
import { useRecipe } from "@/src/hooks/useRecipe";
import FastImage from "react-native-fast-image";

export default function MyRecentlyViewCard(props: RecipeProps) {
  console.log("Recently:", props.mainImage);
  return (
    <Link
      href={{ pathname: "/recipes/[id]", params: { id: props.id } }}
      style={styles.container}
    >
      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
        {props.title}
      </Text>
      <FastImage source={{ uri: props.mainImage }} style={styles.image} />
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.primary[50],
    borderRadius: 8, // Adds rounded corners
    padding: 10,
    width: Dimensions.get("window").width - 165,
    height: 300,
    margin: 7,
    elevation: 2, // For Android shadow
    justifyContent: "center",
    alignContent: "center",
  },
  title: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
    color: "black",
    marginTop: 5,
    textAlign: "center",
    overflow: "hidden",
  },
  image: {
    marginTop: 10,
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 4,
  },
});
