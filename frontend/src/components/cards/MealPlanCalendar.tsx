import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useMealPlan } from "@/src/hooks/useMealPlan";
import { useRecipeList } from "@/src/hooks/useRecipeList";
import { tokens } from "@/src/theme/tokens";
import { Check, Drumstick, PencilLine, Trash2 } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const themeColors = {
  background: "#F3F4F6",
  headerButton: "#FF6B6B",
  mealSection: "#F0F0F0",
  textPrimary: "#333333",
  textSecondary: "#666666",
  modalBackground: "rgba(0, 0, 0, 0.5)",
  modalContent: "#FFFFFF",
};

const MealPlanList = () => {
  const {
    mealPlan,
    error,
    clearDayRecipes,
    refetch,
    toggleConsumed,
    removeRecipe,
  } = useMealPlan();
  const { recipes, recipesLoading, recipesError } = useRecipeList({
    limit: 100,
    offset: 0,
  });

  const [mealData, setMealData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  useEffect(() => {
    if (mealPlan?.weeks && recipes) {
      const currentWeek = mealPlan.weeks.find(
        (week) => week.type === "CURRENT"
      );

      if (currentWeek) {
        const parsedMealData = currentWeek.days.map((day, index) => {
          return {
            date: day.date.split("T")[0],
            meals: day.meals,
            weekday: new Date(day.date).toLocaleString("en-US", {
              weekday: "short",
            }),
            index, // Index do dia para a mutação
          };
        });

        setMealData(parsedMealData);
      }
    }
  }, [mealPlan, recipes]);

  const handleDayClick = (weekday, index) => {
    setSelectedDayIndex(index);
    setModalVisible(true);
  };

  const handleClearDay = async () => {
    if (selectedDayIndex !== null) {
      try {
        await clearDayRecipes({
          weekType: "CURRENT",
          dayIndex: selectedDayIndex,
        });
        Alert.alert(
          "Success",
          `All recipes for ${mealData[selectedDayIndex].weekday} have been cleared.`
        );
        refetch(); // Refaz a busca para atualizar os dados no UI
      } catch (error) {
        Alert.alert("Error", "Failed to clear recipes for the selected day.");
      } finally {
        setModalVisible(false);
        setSelectedDayIndex(null);
      }
    }
  };

  const [consumeModalVisible, setConsumeModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const handleDeleteClick = (dayIndex, mealType, recipeId, recipeTitle) => {
    setSelectedRecipe({ dayIndex, mealType, recipeId, recipeTitle });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (selectedRecipe) {
      try {
        await removeRecipe({
          weekType: "CURRENT",
          dayIndex: selectedRecipe.dayIndex,
          mealType: selectedRecipe.mealType,
          recipeId: selectedRecipe.recipeId,
        });
        Alert.alert(
          "Success",
          `${selectedRecipe.recipeTitle} has been removed from the meal plan.`
        );
        refetch(); // Refresh the data
      } catch (err) {
        Alert.alert(
          "Error",
          `Failed to remove ${selectedRecipe.recipeTitle} from the meal plan.`
        );
      } finally {
        setDeleteModalVisible(false);
        setSelectedRecipe(null);
      }
    }
  };

  const handleConsumeModalClick = (
    dayIndex,
    mealType,
    recipeId,
    recipeTitle
  ) => {
    setSelectedRecipe({ dayIndex, mealType, recipeId, recipeTitle });
    setConsumeModalVisible(true);
  };

  const handleConsumeClick = async (
    dayIndex,
    mealType,
    recipeId,
    recipeTitle
  ) => {
    try {
      await toggleConsumed({
        weekType: "CURRENT",
        dayIndex,
        mealType,
        recipeId,
      });
      Alert.alert("Success", `${recipeTitle} consumption status updated.`);
      refetch(); // Refresh the data
    } catch (err) {
      Alert.alert(
        "Error",
        `Failed to update consumption status for ${recipeTitle}.`
      );
    }
  };

  const renderMealItem = ({ item }) => (
    <View style={styles.page}>
      {/* Header with the day and date */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleDayClick(item.weekday, item.index)}
        >
          <Text style={styles.dayButton}>{item.weekday.toUpperCase()}</Text>
        </TouchableOpacity>
        <Text style={styles.dateButton}>{item.date}</Text>
      </View>

      {/* Meals Section */}
      <View style={styles.mealsContainer}>
        {item.meals.map((meal, mealIndex) => (
          <View key={mealIndex} style={styles.mealSection}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.mealType}>{meal.type.toUpperCase()}</Text>
            </View>
            {meal.recipes ? (
              meal.recipes.map((recipeItem, recipeIndex) => {
                const recipeDetails = recipes.find(
                  (r) => r.id === recipeItem.recipe.id
                );
                return (
                  <View
                    key={recipeIndex}
                    style={
                      recipeItem.isConsumed
                        ? styles.recipeContainerConsumed
                        : styles.recipeContainer
                    }
                  >
                    <View>
                      <Text style={styles.recipeNames}>
                        {recipeDetails?.title || "Unnamed Recipe"}
                      </Text>
                      <Text style={styles.recipeServings}>
                        Servings: {recipeItem.servings}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 20 }}>
                      {recipeItem.isConsumed ? (
                        <Text style={styles.recipeConsumed}>Consumed</Text>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => {
                              handleConsumeModalClick(
                                item.index, // Pass the correct dayIndex from parent
                                meal.type, // Meal type
                                recipeItem.recipe.id, // Recipe ID
                                recipeDetails?.title // Recipe title
                              );
                            }}
                          >
                            <Drumstick
                              size={25}
                              color={tokens.colors.text.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleDeleteClick(
                                item.index, // Day index
                                meal.type, // Meal type
                                recipeItem.recipe.id, // Recipe ID
                                recipeDetails?.title // Recipe title
                              )
                            }
                          >
                            <Trash2
                              size={25}
                              color={tokens.colors.primary[500]}
                            />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View>
                <Text>No recipes found</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      {/* Delete Modal */}

      {/* Consume Modal */}
      <Modal
        visible={consumeModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Are you sure you want to consume {selectedRecipe?.recipeTitle}?
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setConsumeModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.consumeButton}
                onPress={async () => {
                  if (selectedRecipe) {
                    try {
                      await toggleConsumed({
                        weekType: "CURRENT",
                        dayIndex: selectedRecipe.dayIndex,
                        mealType: selectedRecipe.mealType,
                        recipeId: selectedRecipe.recipeId,
                      });
                      Alert.alert(
                        "Success",
                        `${selectedRecipe.recipeTitle} consumption status updated.`
                      );
                      refetch(); // Refresh the data
                    } catch (err) {
                      Alert.alert(
                        "Error",
                        `Failed to update consumption status for ${selectedRecipe.recipeTitle}.`
                      );
                    } finally {
                      setConsumeModalVisible(false);
                      setSelectedRecipe(null);
                    }
                  }
                }}
              >
                <Text style={styles.rateText}>Consume</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Are you sure you want to delete {selectedRecipe?.recipeTitle}?
            </Text>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.consumeButton}
                onPress={async () => {
                  if (selectedRecipe) {
                    try {
                      await removeRecipe({
                        weekType: "CURRENT",
                        dayIndex: selectedRecipe.dayIndex,
                        mealType: selectedRecipe.mealType,
                        recipeId: selectedRecipe.recipeId,
                      });
                      Alert.alert(
                        "Success",
                        `${selectedRecipe.recipeTitle} was deleted from the plan.`
                      );
                      refetch(); // Refresh the data
                    } catch (err) {
                      Alert.alert(
                        "Error",
                        `Failed to delete ${selectedRecipe.recipeTitle}.`
                      );
                    } finally {
                      setDeleteModalVisible(false);
                      setSelectedRecipe(null);
                    }
                  }
                }}
              >
                <Text style={styles.rateText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  if (error || recipesError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading data.</Text>
      </View>
    );
  }

  if (recipesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading recipes...</Text>
      </View>
    );
  }

  if (!mealPlan || mealData.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No meal plan data available.</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={mealData}
        renderItem={renderMealItem}
        keyExtractor={(item) => item.date}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={width}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
      />
    </>
  );
};

const styles = StyleSheet.create({
  page: {
    width,
    height,
    backgroundColor: tokens.colors.background.primary,
    marginTop: 10,
    marginBottom: 200,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dayButton: {
    backgroundColor: themeColors.headerButton,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FFF",
  },
  dateButton: {
    backgroundColor: themeColors.headerButton,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#FFF",
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  mealSection: {
    backgroundColor: tokens.colors.background.secondary,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
  },
  recipeContainer: {
    backgroundColor: tokens.colors.background.tertiary,
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  recipeContainerConsumed: {
    backgroundColor: "#e5f2e4",
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  mealType: {
    fontSize: tokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
  },
  recipeNames: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
  },
  recipeServings: {
    fontSize: tokens.fontSize.md,
  },
  recipeConsumed: {
    fontSize: tokens.fontSize.md,
    fontWeight: tokens.fontWeight.bold,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.07)",
  },
  modalView: {
    backgroundColor: tokens.colors.background.primary,
    width: "80%",
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadius.md,
    padding: 20,
  },
  modalText: {
    fontSize: tokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    textAlign: "center",

    padding: 10,
  },
  closeModalButton: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[100],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  closeModalText: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.normal,
    textAlign: "center",
    fontSize: tokens.fontSize.lg,
  },
  consumeButton: {
    backgroundColor: tokens.colors.primary[50],
    borderColor: tokens.colors.primary[100],
    borderWidth: 2,
    borderRadius: tokens.borderRadius.full,
    flexWrap: "wrap",
    padding: 5,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  rateText: {
    color: tokens.colors.text.primary,
    fontWeight: tokens.fontWeight.normal,
    textAlign: "center",
    fontSize: tokens.fontSize.lg,
  },
});

export default MealPlanList;
