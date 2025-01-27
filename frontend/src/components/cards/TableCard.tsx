import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Lock } from "lucide-react-native";
import { tokens } from "@/src/theme/tokens";

interface TableCardProps {
  title: string;
  recipeCount: number;
  collaboratorCount: number;
  previewImages?: string[];
  isPrivate?: boolean;
}

const TableCard: React.FC<TableCardProps> = ({
  title,
  recipeCount,
  collaboratorCount,
  previewImages = [],
  isPrivate = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              {isPrivate && (
                <Lock
                  size={18}
                  color={tokens.colors.primary[500]}
                  style={styles.icon}
                />
              )}
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.recipeCount}>
              {recipeCount} {recipeCount === 1 ? "Recipe" : "Recipes"}
            </Text>
          </View>

          {isPrivate && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Collaborator Count */}
          <View style={styles.collaborators}>
            <Text style={styles.collaboratorCount}>
              {collaboratorCount}{" "}
              {collaboratorCount === 1 ? "collaborator" : "collaborators"}
            </Text>
          </View>

          {/* Recipe Preview Images */}
          {previewImages && previewImages.length > 0 && (
            <View style={styles.imageRow}>
              {previewImages.slice(0, 3).map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    defaultSource={require("../../../assets/images/NoNotes.png")}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "70%",

    borderRadius: tokens.borderRadius.lg,
    backgroundColor: tokens.colors.primary[50],
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: tokens.colors.text.primary,
  },
  recipeCount: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
    marginTop: 4,
  },
  privateBadge: {
    backgroundColor: tokens.colors.primary[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  privateBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: tokens.colors.primary[700],
  },

  collaborators: {
    flexDirection: "row",
    alignItems: "center",
  },
  collaboratorCount: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
  },
  imageRow: {
    flexDirection: "row",
    gap: 8,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});

export default TableCard;
