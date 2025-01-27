import React, { useState, useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import MyRecipeCard from "@/src/components/cards/RecipeCard";
import { tokens } from "@/src/theme/tokens";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import { useTable } from "@/src/hooks/useTable";
import { ChevronLeft, MoreVertical } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import EditCollectionModal from "@/src/components/modal/EditTableModal";
import TableConfigModal from "@/src/components/modal/TableConfigModal";
import ManageCollaboratorsModal from "@/src/components/modal/ManageCollaboratorsModal";
import { useUser } from "@/src/hooks/useUser";

interface RecipeWithExtras {
  id: string;
  title: string;
  mainImage: string;
  subtitle: string;
  costPerServing: number;
  difficulty: number;
  totalTime: number;
  servings: number;
  ingredients: string[];
  description: string;
  addedAt: string;
}

export default function TableDetails() {
  const { id } = useLocalSearchParams(); // Get the table ID from the route
  const {
    table,
    loading: tableLoading,
    error: tableError,
    updateTable,
    removeCollaborator,
    updateCollaboratorRole,
    addCollaborator,
  } = useTable({ id }); // Load the table directly
  const [recipesWithExtras, setRecipesWithExtras] = useState<
    RecipeWithExtras[]
  >([]);
  const [collaboratorsWithData, setCollaboratorsWithData] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false); // State to control modal visibility
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [
    isManageCollaboratorsModalVisible,
    setManageCollaboratorsModalVisible,
  ] = useState(false);
  const { fetchUserById, fetchUserByEmail } = useUser();

  // Fetch recipes when the table is loaded
  const { recipes, recipesLoading, recipesError } = useRecipeList({
    query: table?.recipes
      ? table.recipes.map((r) => r.recipe.id).join(",")
      : "", // Use recipe.id
    limit: table?.recipes ? table.recipes.length : 0,
  });

  const handleSaveCollection = async (
    title: string,
    subtitle: string,
    privacy: string
  ) => {
    try {
      const input = { title, subtitle, privacy };
      await updateTable(id as string, input); // Call the updateTable function
      console.log("Collection updated successfully");
    } catch (error) {
      console.error("Error updating collection:", error);
    }
  };

  // Fetch collaborator data when the table is loaded
  useEffect(() => {
    if (table?.collaborators) {
      console.log("Collaborators:", table.collaborators);
      const fetchCollaborators = async () => {
        try {
          const collaborators = await Promise.all(
            table.collaborators.map(async (collaborator) => {
              console.log("Fetching user for collaborator:", collaborator);
              const user = await fetchUserById(collaborator.user.id);
              console.log("Fetched user:", user);
              return {
                ...collaborator,
                user: user || collaborator.user,
              };
            })
          );
          setCollaboratorsWithData(collaborators);
        } catch (error) {
          console.error("Error fetching collaborators:", error);
        }
      };

      fetchCollaborators();
    }
  }, [table]);

  useEffect(() => {
    if (table?.recipes && recipes) {
      // Map over table.recipes and enrich with full recipe data
      const enrichedRecipes = table.recipes
        .filter((entry) => entry.recipe) // Filter out entries without a `recipe` field
        .map((entry) => {
          const fullRecipe = recipes.find((r) => r.id === entry.recipe.id); // Find the full recipe data
          return {
            ...fullRecipe, // Spread the full recipe data
            id: entry.recipe.id || "unknown", // Use the recipe's ID
            addedAt: entry.addedAt || "Desconhecida",
          };
        });

      setRecipesWithExtras(enrichedRecipes);
    }
  }, [table, recipes]); // Add `recipes` as a dependency

  const renderRecipeCard = ({ item }) => {
    // Transform the item to match the structure expected by MyRecipeCard
    const recipeForCard = {
      id: item.id,
      mainImage: item.mainImage || "https://via.placeholder.com/150", // Fallback image
      title: item.title,
      subtitle: item.subtitle,
      costPerServing: item.costPerServing,
      difficulty: item.difficulty,
      totalTime: item.totalTime,
      servings: item.servings || 4, // Provide a default value if servings is missing
      ingredients: item.ingredients || [], // Provide a default value if ingredients is missing
      description: item.description || "No description available", // Provide a default value if description is missing
    };

    return (
      <View style={styles.cardWrapper}>
        {/* Pass the transformed recipe object to the card */}
        <MyRecipeCard {...recipeForCard} />
      </View>
    );
  };

  const renderCollaborator = ({ item }) => (
    <View style={styles.collaboratorContainer}>
      <Text style={styles.collaboratorText}>
        {item.user?.profile?.username || item.user?.email || "Desconhecido"}
      </Text>
    </View>
  );

  if (!table) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tabela não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.collectionName}>{table.title}</Text>
        </View>
        <View style={styles.privacyContainer}>
          <Text style={[styles.privacyText]}>
            {table.privacy === "PUBLIC" ? "Public" : "Private"}
          </Text>
        </View>
        {/* Show modal when the three dots are clicked */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setModalVisible(true)}
        >
          <MoreVertical size={24} color={tokens.colors.primary[700]} />
        </TouchableOpacity>
      </View>

      {/* Subtitle and Collaborators */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.collectionSubtitle}>
          {table.subtitle || "No subtitle available"}
        </Text>
        <Text style={styles.collectionSubtitle}>
          {table.recipeCount} recipes in the table
        </Text>
        <View style={styles.collaborators}>
          <Text style={styles.collaboratorsText}>
            {table.collaborators?.length || 0} chefs in the kitchen
          </Text>
        </View>
      </View>

      {/* Edit Collection Modal */}
      <EditCollectionModal
        isVisible={isEditModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveCollection}
        initialTitle={table?.title || ""}
        initialSubtitle={table?.subtitle || ""}
        initialPrivacy={table?.privacy || "PUBLIC"}
      />

      {/* Collaborator List */}
      <View style={styles.collaboratorsSection}>
        <FlatList
          data={collaboratorsWithData}
          keyExtractor={(item) => item.user.id || "unknown"}
          renderItem={renderCollaborator}
          horizontal
          contentContainerStyle={styles.collaboratorsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum colaborador encontrado.</Text>
          }
        />
      </View>

      {/* Recipe List */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <FlatList
          data={recipesWithExtras}
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeCard}
          numColumns={2}
          contentContainerStyle={styles.flatListContainer}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma receita encontrada.</Text>
          }
        />
      </ScrollView>

      {/* Manage Collaborators Modal */}
      <ManageCollaboratorsModal
        isVisible={isManageCollaboratorsModalVisible}
        onClose={() => setManageCollaboratorsModalVisible(false)}
        collaborators={collaboratorsWithData}
        isOwner={table?.myRole === "OWNER"}
        onDeleteCollaborator={async (userId) => {
          await removeCollaborator(id as string, userId);
          setCollaboratorsWithData(
            collaboratorsWithData.filter((c) => c.user.id !== userId)
          );
        }}
        onUpdateRole={async (userId, role) => {
          // Ensure the role is valid
          const validRoles = ["OWNER", "EDITOR", "VIEWER"]; // Adjust based on your schema
          if (!validRoles.includes(role)) {
            console.error(
              `Invalid role: ${role}. Valid roles are: ${validRoles.join(", ")}`
            );
            return;
          }

          await updateCollaboratorRole(id as string, userId, role);
          setCollaboratorsWithData(
            collaboratorsWithData.map((c) =>
              c.user.id === userId ? { ...c, role } : c
            )
          );
        }}
        onAddCollaborator={async (email) => {
          try {
            // Step 1: Call the addCollaborator function from useTable
            await addCollaborator({ tableId: id as string, email });

            // Step 2: Refresh the collaborators list
            const updatedCollaborators = await fetchUserById(
              table?.collaborators
            );
            setCollaboratorsWithData(updatedCollaborators);

            // Step 3: Optionally, show a success message
            console.log("Collaborator added successfully!");
          } catch (error) {
            // Step 4: Handle errors and show a user-friendly message
            console.error("Error adding collaborator:", error);
            alert("Failed to add collaborator. Please try again.");
          }
        }}
      />

      {/* Table Config Modal */}
      <TableConfigModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onEditCollection={() => {
          setModalVisible(false); // Close the TableConfigModal
          setEditModalVisible(true); // Open the EditCollectionModal
        }}
        onManageCollaborator={() => {
          setModalVisible(false);
          setManageCollaboratorsModalVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    marginTop: 30,
  },
  backButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  collectionName: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: "bold",
    color: tokens.colors.primary[700],
  },
  collectionSubtitle: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    marginBottom: 8,
  },
  collaborators: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  collaboratorsText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
  },
  collaboratorsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: "bold",
    color: tokens.colors.primary[700],
    marginBottom: 8,
  },
  collaboratorsList: {
    paddingVertical: 8,
  },
  collaboratorContainer: {
    backgroundColor: tokens.colors.primary[100],
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  collaboratorText: {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.primary[700],
  },
  flatListContainer: {
    paddingBottom: 16,
  },
  cardWrapper: {
    width: Dimensions.get("window").width / 2 + 10, // Fixed width for cards
    margin: 8, // Consistent margin
  },
  columnWrapper: {
    justifyContent: "space-between", // Space out cards evenly
  },
  loadingText: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.primary[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: tokens.fontSize.md,
  },
  emptyText: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    textAlign: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  privacyContainer: {
    marginRight: 16,
  },
  privacyText: {
    fontSize: tokens.fontSize.sm,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#ff4444",
  },
});
