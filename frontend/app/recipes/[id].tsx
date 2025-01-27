import {
  View,
  Text,
  StyleSheet,
  TouchableHighlight,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
} from "react-native";
import { Link, router, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/src/hooks/useAuth";
import { useUser } from "@/src/hooks/useUser";
import { Button } from "@/src/components/form/Button";
import { tokens } from "@/src/theme/tokens";
import {
  BotMessageSquare,
  CirclePlus,
  CircleMinus,
  Utensils,
  CalendarDays,
  NotepadText,
  Bookmark,
  Share2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import { useRecipe } from "@/src/hooks/useRecipe";
import MyTagChip from "@/src/components/chips/TagChip";
import MyRecipeTagChip from "@/src/components/chips/RecipeTagChip";
import MyIngredientItem from "@/src/components/cards/IngredientItem";
import MealPlannerModal from "@/src/components/modal/MealPlannerModal";
import { useMealPlan } from "@/src/hooks/useMealPlan";
import { useRecipeNote } from "@/src/hooks/useRecipeNote";
import Toast from "react-native-toast-message";
import AddToCollectionModal from "@/src/components/modal/AddRecipeTableModal";
import { useTable } from "@/src/hooks/useTable";
import { useRecipeHistory } from "@/src/hooks/useRecipeHistory";

export default function RecipeDetails() {
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipeDetails, detailsLoading, detailsError } = useRecipe({
    id: id || "",
  });

  const [portions, setPortions] = useState(1);
  const [adjustedIngredients, setAdjustedIngredients] = useState([]);

  const [averageRating, setAverageRating] = useState(0);

  const [carouselImages, setCarouselImages] = useState([]);

  //Modal for the Meal Pllaning Visibility Control
  const [isModalOpen, setIsModalOpen] = useState(false);

  //Table Variables
  const [isModalVisible2, setModalVisible2] = useState(false);

  const {
    tables,
    addRecipeToTable,
    refresh: { tables: refreshMyTables },
  } = useTable();

  const recipeId = id;

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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  //Fetching useMealPlan
  const { mealPlan, addRecipe } = useMealPlan();

  //To show and hide the Note Modal
  const [modalVisible, setModalVisible] = useState(false);

  //Using the useRecipeNote with the Recipe ID from the params
  const { note, handleSaveNote } = useRecipeNote({ recipeId: id });

  //Defining noteContent
  const [noteContent, setNoteContent] = useState(note?.content || "");

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const {
    history,
    historyLoading,
    historyError,
    historyRefetch,
    addToHistory,
  } = useRecipeHistory();

  // Function to save note and trigger message output for the user
  const saveNote = () => {
    handleSaveNote({ recipeId: id, content: noteContent.trim() })
      .then(() => {
        console.log("Note saved successfully");

        Alert.alert("Success", "Your note was saved successfully!", [
          { text: "OK", onPress: () => console.log("OK Pressed") },
        ]);
      })
      .catch((error) => {
        console.log("Failed to save note", error);

        Alert.alert("Error", "Failed to save the note. Please try again.", [
          { text: "OK", onPress: () => console.log("OK Pressed") },
        ]);
      });
  };

  const difficultyArray = Array(4)
    .fill(0)
    .map((_, index) => index + 1);

  useEffect(() => {
    if (recipeDetails) {
      setPortions(recipeDetails.servings || 1);
      setAdjustedIngredients(recipeDetails.ingredients || []);

      if (recipeDetails.reviews && recipeDetails.reviews.length > 0) {
        const totalRating = recipeDetails.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = totalRating / recipeDetails.reviews.length;
        setAverageRating(avgRating.toFixed(1));
      } else {
        setAverageRating(0);
      }
    }

    if (note?.content) {
      setNoteContent(note.content);
    }
  }, [recipeDetails, modalVisible, note]);

  useEffect(() => {
    if (recipeDetails) {
      const updatedIngredients = recipeDetails.ingredients.map((item) => ({
        ...item,
        amount: (item.amount * portions) / recipeDetails.servings,
      }));
      setAdjustedIngredients(updatedIngredients);
      // Check if there are additional images or just the mainImage
      const carouselImages =
        recipeDetails.images && recipeDetails.images.length > 0
          ? [recipeDetails.mainImage, ...recipeDetails.images]
          : recipeDetails.mainImage;
      setCarouselImages(carouselImages);
    }
  }, [portions, recipeDetails]);

  const increasePortions = () => setPortions(portions + 1);
  const decreasePortions = () => portions > 1 && setPortions(portions - 1);

  useEffect(() => {
    const startTime = Date.now(); // Record when the user opens the page

    const timer = setTimeout(() => {
      if (recipeDetails?.id) {
        const viewDuration = Math.floor((Date.now() - startTime) / 1000); // View duration in seconds

        addToHistory({
          variables: {
            recipeId: recipeDetails.id,
            viewDuration,
          },
        })
          .then(() => console.log("Recipe added to history"))
          .catch((err) =>
            console.error("Error adding recipe to history:", err)
          );
      }
    }, 5000); // 5 seconds delay

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [recipeDetails, addToHistory]);

  if (detailsLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (detailsError) {
    return (
      <View style={styles.container}>
        <Text>Error loading recipe: {detailsError.message}</Text>
      </View>
    );
  }

  if (!recipeDetails) {
    return (
      <View style={styles.container}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <FlatList
        horizontal
        pagingEnabled
        data={carouselImages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Image
            key={index}
            style={{ width: screenWidth, height: screenHeight / 2.6 }}
            source={{ uri: item }}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
      <View style={styles.actionsContainer}>
        {/*"Modo passo a passo - Mode Step By Step"*/}
        <TouchableOpacity
          style={styles.actionsButtons}
          onPress={() => router.push(`/step-by-step/${id}`)}
        >
          <Utensils size={30} color={tokens.colors.primary[500]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionsButtons} onPress={openModal}>
          <CalendarDays size={30} color={tokens.colors.primary[500]} />
        </TouchableOpacity>

        {/*Adicionar Notas à Receita - Add notes to the recipe*/}
        <TouchableOpacity
          style={styles.actionsButtons}
          onPress={() => setModalVisible(true)}
        >
          <NotepadText size={30} color={tokens.colors.primary[500]} />
        </TouchableOpacity>

        {/*Adicionar Receita à coleção - Add recipe to a table*/}
        <TouchableOpacity
          style={styles.actionsButtons}
          onPress={() => setModalVisible2(true)}
        >
          <Bookmark size={30} color={tokens.colors.primary[500]} />
        </TouchableOpacity>

        {/*Gerar um link de partilha da receita - Generate a link to share the recipe*/}
        <TouchableOpacity style={styles.actionsButtons}>
          <Share2 size={30} color={tokens.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/*Modal Para adicionar a Coleção - Modal to add to collection*/}
      <AddToCollectionModal
        isVisible={isModalVisible2}
        onClose={() => setModalVisible2(false)}
        tables={tables}
        recipeId={recipeId}
        onAddToTable={handleAddToTable}
      />

      {/*Modal Para colocar nota - Modal to write Note*/}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* X button to close the modal */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              {/* Título do modal - Modal Title */}
              <Text style={styles.modalTitle}>Add Notes For this Recipe</Text>

              {/* Input para a nota - Note Input */}
              <TextInput
                style={styles.input}
                placeholder={
                  note?.content?.trim()
                    ? note.content // Mostra a nota atual, se existir
                    : "Put spice in your recipes, give your own hint to make it taste better" // Placeholder padrão
                }
                value={noteContent}
                onChangeText={setNoteContent} // Atualiza o estado com o texto do input
                multiline={true}
              />

              {/* Botão Save  - Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  saveNote(); //Chama a função handleSaveNote do hook e mostra uma mensagem de retorno ao utilizador
                  setModalVisible(false); // Fecha o modal após salvar
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/*Mostra reviews da receita + Botão para página de review da mesma - Show Recipe's avarage rating + Takes to the review page "*/}
      <View style={styles.recipeContainer}>
        <Text style={styles.title}>{recipeDetails.title}</Text>
        <Text style={styles.subtitle}>{recipeDetails.subtitle}</Text>
        <TouchableOpacity style={styles.ratingContainer}>
          <Link
            href={{
              pathname: "/reviews/[id]",
              params: { id: recipeDetails.id },
            }}
          >
            <Text style={styles.ratingText}>
              {averageRating != 0 ? averageRating : "No reviews yet"}
            </Text>
            {averageRating != 0 && (
              <Image
                source={require("../../assets/images/rating.png")}
                style={styles.ratingImage}
              />
            )}
          </Link>
        </TouchableOpacity>

        {/*Mostra detalhes da receita - Show recipe details*/}
        <ScrollView
          style={styles.wrapContainerTags}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {recipeDetails.tags.map((tag, index) => (
            <MyRecipeTagChip
              key={index}
              name={tag.name}
              category={tag.category}
            />
          ))}
        </ScrollView>

        {/*Modal Meal Plan */}
        {isModalOpen && (
          <MealPlannerModal
            onClose={() => setIsModalOpen(false)}
            recipeId={recipeDetails.id}
            mealPlan={mealPlan} // Pass existing meal plan
            addRecipe={addRecipe} // Pass the mutation
          />
        )}

        <View style={styles.infoMainContainer}>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Difficulty</Text>
            <View style={styles.difficultyLevels}>
              {difficultyArray.map((level) => (
                <View
                  key={level}
                  style={[
                    styles.ball,
                    level <= recipeDetails.difficulty
                      ? styles.activeBall
                      : styles.inactiveBall,
                  ]}
                />
              ))}
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Prep Time</Text>
            <Text style={styles.infoValue}>{recipeDetails.prepTime} min</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Cook Time</Text>
            <Text style={styles.infoValue}>{recipeDetails.cookTime} min</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Total Time</Text>
            <Text style={styles.infoValue}>{recipeDetails.totalTime} min</Text>
          </View>
        </View>
        <Text style={styles.description}>{recipeDetails.description}</Text>
        {/* Ingredients */}

        <View>
          <View style={styles.servingsContainer}>
            <Text style={styles.ingredients}>Ingredients</Text>
            <Text style={styles.ingredients}>({portions} portions)</Text>

            <View style={styles.servingsButtonsContainer}>
              <TouchableOpacity onPress={increasePortions}>
                <CirclePlus size={30} color={tokens.colors.primary[500]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={decreasePortions}>
                <CircleMinus size={30} color={tokens.colors.primary[500]} />
              </TouchableOpacity>
            </View>
            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>
                {recipeDetails.costPerServing}€/portion
              </Text>
            </View>
          </View>
          {adjustedIngredients.map((item, index) => (
            <MyIngredientItem
              key={index}
              name={
                item.ingredientName ? item.ingredientName : item.ingredient.name
              }
              amount={item.amount}
              unit={item.unit != "unit" ? item.unit : ""}
            />
          ))}
        </View>
        {/*Tips and hacks section */}
        <View style={{ flexDirection: "row", paddingTop: 50 }}>
          <Image
            source={require("../../assets/images/tipsAvatar.png")}
            style={{ width: 50, height: 50, marginRight: 20 }}
          />
          <View style={{ flexDirection: "column", width: "100%" }}>
            <Text style={styles.tipsChefTitle}>Tips & Hacks</Text>
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsText}>
                {recipeDetails.tipsAndHacks
                  ? recipeDetails.tipsAndHacks
                  : "No tips for now!"}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", paddingTop: 50 }}>
          <Image
            source={require("../../assets/images/chefAvatar.png")}
            style={{ width: 50, height: 50, marginRight: 20 }}
          />
          <View style={{ flexDirection: "column", width: "100%" }}>
            <Text style={styles.tipsChefTitle}>Chef's Secret</Text>
            <View style={styles.chefContainer}>
              <Text style={styles.chefText}>
                {recipeDetails.chefSecret
                  ? recipeDetails.chefSecret
                  : "No secrets needed!"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  recipeContainer: {
    padding: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: tokens.fontSize.xxl,
    fontWeight: "bold",
    paddingTop: 10,
  },
  subtitle: {
    fontSize: tokens.fontSize.lg,
    fontStyle: "italic",
    paddingTop: 10,
  },
  ingredients: {
    fontSize: tokens.fontSize.lg,

    fontWeight: tokens.fontWeight.medium,
  },
  recipeImage: {
    width: "100%",
    height: 400,
  },
  wrapContainerTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 20,
  },
  infoLabel: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    paddingBottom: 10,
  },
  infoValue: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.normal,
    color: tokens.colors.primary[400],
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoMainContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 20,
  },
  difficultyLevels: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
  },
  ball: {
    width: 15,
    height: 15,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  activeBall: {
    backgroundColor: tokens.colors.primary[500],
  },
  inactiveBall: {
    backgroundColor: tokens.colors.gray[300],
  },
  description: {
    fontSize: tokens.fontSize.lg,
    paddingTop: 30,
  },
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 30,
    paddingBottom: 10,
  },
  servingsButtonsContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  costContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  costLabel: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    textAlign: "right",
  },
  tipsContainer: {
    backgroundColor: "#b5d1ff",
    padding: 10,
    width: "70%",
    borderRadius: tokens.borderRadius.md,
  },
  tipsAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#b5d1ff",
    marginRight: 25,
  },
  tipsText: {
    fontSize: tokens.fontSize.md,
  },
  chefContainer: {
    backgroundColor: "#ff7640",
    padding: 10,
    width: "70%",
    borderRadius: tokens.borderRadius.md,
  },
  chefAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ff7640",
    marginRight: 25,
  },
  chefText: {
    fontSize: tokens.fontSize.md,
  },
  tipsChefTitle: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    paddingBottom: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "center",
    gap: 24,
    width: "100%",
    alignItems: "center",

    flexWrap: "wrap",
    position: "absolute",
    top: 200,
  },
  actionsButtons: {
    backgroundColor: tokens.colors.background.primary,
    padding: 7,
    borderRadius: tokens.borderRadius.full,
  },
  ratingContainer: {
    borderWidth: 1.5,
    flexDirection: "row",
    borderRadius: tokens.borderRadius.full,
    borderColor: "#fc4103",
    padding: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    marginTop: 15,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  ratingText: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.medium,
    marginRight: 2,
  },
  ratingImage: {
    width: 25,
    height: 25,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  success: {
    color: "green",
  },
  error: {
    color: "red",
  },
});
