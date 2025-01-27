import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from "react-native";

interface MealPlannerModalProps {
  onClose: () => void;
  recipeId: string;
  mealPlan: any; // Meal plan data passed from the parent
  addRecipe: (input: any) => Promise<void>; // Mutation function passed from the parent
}

// Helper function to generate days of the current week
const getDaysOfWeek = () => {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const today = new Date();
  const currentWeek = [];

  // Set the start of the week to Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Adjust to Sunday

  // Generate dates for the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i); // Increment day by `i`
    currentWeek.push({
      label: days[i],
      date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
    });
  }

  return currentWeek;
};

// Mapping frontend meal types to backend enum values
const mealTypeMapping: Record<string, string> = {
  Breakfast: "BREAKFAST",
  Lunch: "LUNCH",
  Dinner: "DINNER",
  Snack: "SNACK",
};

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({
  onClose,
  recipeId,
  mealPlan,
  addRecipe,
}) => {
  // Get dynamically generated days of the week
  const daysOfWeek = getDaysOfWeek();

  // States to track selected day, meal type, and servings
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [servings, setServings] = useState(1); // Default to 1 serving

  // Set the default selected day to today's day on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSelectedDay(today);
  }, []);

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const handleAddRecipe = async () => {
    if (!selectedDay) {
      Alert.alert("Erro", "Please Select a day");
      return;
    }

    if (!selectedMealType) {
      Alert.alert("Erro", "Please, Select a Meal Type");
      return;
    }

    try {
      const weekType = "CURRENT"; // Adjust this as needed
      const dayIndex = daysOfWeek.findIndex((day) => day.date === selectedDay);

      const backendMealType = mealTypeMapping[selectedMealType];
      if (!backendMealType) {
        Alert.alert("Erro", "Not valid meal type.");
        return;
      }

      await addRecipe({
        recipeId,
        weekType,
        dayIndex,
        mealType: backendMealType,
        servings,
      });

      Alert.alert("Sucesso", "Recipe added with success");
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar receita:", error);
      Alert.alert("Erro", "Error at adding the recipe");
    }
  };

  const incrementServings = () => {
    if (servings < 12) setServings(servings + 1);
  };

  const decrementServings = () => {
    if (servings > 1) setServings(servings - 1);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={onClose} // Handles Android back button
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add to this weak meal plan</Text>

          {/* Day Selector */}
          <View style={styles.daySelector}>
            {daysOfWeek.map((day) => (
              <TouchableOpacity
                key={day.date}
                onPress={() => setSelectedDay(day.date)}
                style={[
                  styles.dayButton,
                  selectedDay === day.date && styles.selectedButton,
                ]}
              >
                <Text style={styles.dayLabel}>{day.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meal Type Selector with Horizontal Slider */}
          <FlatList
            horizontal
            data={mealTypes}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedMealType(item)}
                style={[
                  styles.mealTypeItem,
                  selectedMealType === item && styles.selectedMealType,
                ]}
              >
                <Text
                  style={[
                    styles.mealTypeText,
                    selectedMealType === item && styles.selectedMealText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Servings Selector */}
          <View style={styles.servingsSelector}>
            <TouchableOpacity
              onPress={decrementServings}
              style={styles.servingButton}
            >
              <Text style={styles.servingButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.servingCount}>{servings}</Text>
            <TouchableOpacity
              onPress={incrementServings}
              style={styles.servingButton}
            >
              <Text style={styles.servingButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity onPress={handleAddRecipe} style={styles.addButton}>
            <Text style={styles.addButtonText}>Adicionar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  daySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 5,
  },
  selectedButton: {
    backgroundColor: "#878787",
  },
  dayLabel: {
    fontSize: 14,
  },
  horizontalList: {
    alignItems: "center",
    marginBottom: 20,
  },
  mealTypeItem: {
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  selectedMealType: {
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  mealTypeText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  selectedMealText: {
    fontWeight: "bold",
    color: "#000",
  },
  servingsSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  mealTypeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  mealButton: {
    padding: 10,
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 5,
  },
  mealLabel: {
    fontSize: 14,
  },

  servingButton: {
    padding: 10,
    backgroundColor: "#f7f7f7",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 10,
  },
  servingButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  servingCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
  },
});

export default MealPlannerModal;
