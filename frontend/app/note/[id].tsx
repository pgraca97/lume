import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { tokens } from "@/src/theme/tokens";
import RecipeNoteCard from "@/src/components/cards/RecipeNoteCard";
import { useRecipeNote } from "@/src/hooks/useRecipeNote";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import { ArrowLeft, Edit, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function RecipeNotesScreen() {
  const router = useRouter();

  // Fetch notes
  const {
    allNotes,
    refetchAllNotes,
    allNotesLoading,
    allNotesError,
    handleSaveNote,
    handleDeleteNote,
  } = useRecipeNote({
    recipeId: "",
  });

  // Fetch recipes
  const { recipes, recipesLoading, refetchRecipes } = useRecipeList({});

  // Merged data state
  const [mergedData, setMergedData] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null); // To store the selected note
  const [modalVisible, setModalVisible] = useState(false);
  const [updatedNote, setUpdatedNote] = useState(""); // To edit the Note
  const [refreshing, setRefreshing] = useState(false);

  // Combine notes with recipe titles
  useEffect(() => {
    refetchAllNotes;
    if (allNotes && recipes) {
      const merged = allNotes.map((note) => {
        const recipe = recipes.find((r) => r.id === note.recipeId);
        return {
          ...note,
          recipeTitle: recipe ? recipe.title : "Untitled Recipe",
        };
      });
      setMergedData(merged);
    }
  }, [allNotes, recipes]);

  const handleCardPress = (note) => {
    setSelectedNote(note); // Define the selected Note

    setModalVisible(true); // Opens the Modal
  };

  //Handle with the edit of the note
  const handleEdit = async () => {
    if (!selectedNote) return;

    try {
      await handleSaveNote({
        recipeId: selectedNote.recipeId,
        content: updatedNote.trim(),
      });
      Alert.alert("Success", "Note updated successfully!");
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating note:", error);
      Alert.alert("Error", "Failed to update note. Please try again.");
    }
  };

  //handle with the delete of the note
  const handleDelete = async () => {
    if (!selectedNote) return;

    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "Deleting note with recipeId:",
                selectedNote.recipeId
              ); // Deve mostrar 24 caracteres válidos
              await handleDeleteNote(selectedNote.recipeId); // Passa o recipeId diretamente
              console.log("Note deleted successfully!"); // Verifica se passou daqui
              Alert.alert("Success", "Note deleted successfully!");
              setModalVisible(false);
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Error", "Failed to delete note. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Função de atualização
  const onRefresh = async () => {
    try {
      setRefreshing(true); 
      await Promise.all([refetchAllNotes(), refetchRecipes()]); 
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (allNotesLoading || recipesLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (allNotesError) {
    return (
      <View style={styles.container}>
        <Text>Error loading notes: {allNotesError.message}</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.container}
        data={mergedData} // Dados combinados
        keyExtractor={(item) => item.recipeId}
        refreshing={refreshing}
        onRefresh={onRefresh} // Função de atualização
        ListHeaderComponent={
          <View style={{ marginLeft: 50 }}>
            {/* Títulos */}
            <Text style={styles.title}>Your Notes</Text>
            <Text style={styles.subtitle}>
              Personal Notes for perfect personal recipes!
            </Text>
          </View>
        }
        ListEmptyComponent={
          // Componente exibido quando não há dados
          <View style={styles.emptyContainer}>
            <Image
              style={styles.image}
              source={require("../../assets/images/NoNotes.png")}
            />
            <Text style={styles.emptyText}>
              Spice up your recipes with a Note!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeNoteCard
            title={item.recipeTitle}
            note={item.content}
            onPress={() => handleCardPress(item)} // Abre o modal com detalhes
          />
        )}
      />

      {/* Modal */}
      {selectedNote && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Title and icons*/}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedNote.recipeTitle}
                </Text>
                <View style={styles.modalIcons}>
                  <TouchableOpacity onPress={handleEdit}>
                    <Edit size={24} color={tokens.colors.primary[500]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete}>
                    <Trash2 size={24} color={tokens.colors.primary[500]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Note content */}
              <TextInput
                style={styles.textArea}
                multiline
                value={updatedNote}
                onChangeText={setUpdatedNote}
                placeholder={selectedNote.content}
              />

              {/* Close button*/}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    padding: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.primary[500],
    marginLeft: 5,
  },
  title: {
    fontSize: tokens.fontSize.xxxl,
    marginBottom: 5,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.secondary,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: tokens.fontSize.lg,
    textAlign: "center",
    marginTop: 50,
    color: tokens.colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.md,
    padding: 20,
    alignItems: "flex-start",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: tokens.fontSize.xl,
    fontWeight: "bold",
  },
  modalIcons: {
    flexDirection: "row",
    gap: 15,
  },
  modalNote: {
    fontSize: tokens.fontSize.md,
    color: tokens.colors.text.primary,
    marginTop: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: tokens.colors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: tokens.borderRadius.sm,
  },
  closeButtonText: {
    color: "white",
    fontSize: tokens.fontSize.md,
    fontWeight: "bold",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },

  container2: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: tokens.colors.background.primary,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50, // Ajuste conforme necessário
  },
});
