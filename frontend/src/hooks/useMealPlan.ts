import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MEAL_PLAN,
  ADD_RECIPE_TO_MEAL_PLAN,
  MOVE_FROM_TABLE_TO_MEAL_PLAN,
  TOGGLE_RECIPE_CONSUMED,
  CLEAR_DAY,
  CLEAR_WEEK,
  DUPLICATE_WEEK,
  UPDATE_MEAL_PLAN_SETTINGS,
  UPDATE_RECIPE_SERVINGS,
  REMOVE_RECIPE_MEAL,
} from "../graphql/operations/mealPlan";
import { useState } from "react";
import { useEffect } from "react";

export const useMealPlan = () => {
  const [globalLoading, setGlobalLoading] = useState(false); // Indicates if a mutation is in progress
  const [globalError, setGlobalError] = useState<string | null>(null); // Stores error messages

  // Query to fetch the meal plan
  const { data, loading, error, refetch } = useQuery(GET_MEAL_PLAN);

  /*useEffect(() => {
    console.log("Meal plan data:", data?.mealPlan);
  }, [data]);*/

  // Mutations
  const [addRecipeToMealPlan] = useMutation(ADD_RECIPE_TO_MEAL_PLAN);
  const [moveFromTableToMealPlan] = useMutation(MOVE_FROM_TABLE_TO_MEAL_PLAN);
  const [toggleRecipeConsumed] = useMutation(TOGGLE_RECIPE_CONSUMED);
  const [removeRecipeMeal] = useMutation(REMOVE_RECIPE_MEAL);
  const [clearDay] = useMutation(CLEAR_DAY);
  const [clearWeek] = useMutation(CLEAR_WEEK);
  const [duplicateWeek] = useMutation(DUPLICATE_WEEK);
  const [updateMealPlanSettings] = useMutation(UPDATE_MEAL_PLAN_SETTINGS);
  const [updateRecipeServings] = useMutation(UPDATE_RECIPE_SERVINGS);

  // Generic function to execute any mutation
  const executeMutation = async (mutation: any, variables: any) => {
    try {
      setGlobalLoading(true);
      setGlobalError(null);
      const response = await mutation({ variables });
      console.log("Mutation response:", response.data);

      return response;
    } catch (err: any) {
      setGlobalError(err.message || "Unknown error");
      console.error("Mutation error:", err);
      throw err;
    } finally {
      setGlobalLoading(false);
    }
  };

  // Specific functions for each mutation
  const addRecipe = (input: {
    recipeId: string;
    weekType: string;
    dayIndex: number;
    mealType: string;
    servings: number;
  }) => {
    console.log("Adding recipe to meal plan with input:", input);
    return executeMutation(addRecipeToMealPlan, { input });
  };

  const moveRecipeFromTable = (input: {
    tableId: string;
    recipeId: string;
    weekType: string;
    dayIndex: number;
    mealType: string;
    servings: number;
  }) => {
    console.log("Moving recipe from table to meal plan with input:", input);
    return executeMutation(moveFromTableToMealPlan, { input });
  };

  const toggleConsumed = (input: {
    weekType: string;
    dayIndex: number;
    mealType: string;
    recipeId: string;
  }) => {
    console.log("Toggling consumed status with input:", input);
    return executeMutation(toggleRecipeConsumed, { input });
  };

  const removeRecipe = (input: {
    weekType: string;
    dayIndex: number;
    mealType: string;
    recipeId: string;
  }) => {
    console.log("Removing recipe from meal with input:", input);
    return executeMutation(removeRecipeMeal, { input });
  };

  const clearDayRecipes = (input: { weekType: string; dayIndex: number }) => {
    console.log("Clearing recipes for day with input:", input);
    return executeMutation(clearDay, { input });
  };

  const clearWeekRecipes = (weekType: string) => {
    console.log("Clearing recipes for week of type:", weekType);
    return executeMutation(clearWeek, { weekType });
  };

  const duplicateMealPlanWeek = (input: {
    sourceWeek: string;
    targetWeek: string;
  }) => {
    console.log("Duplicating week with input:", input);
    return executeMutation(duplicateWeek, { input });
  };

  const updateSettings = (input: {
    weekStartDay?: number;
    autoGenerateShoppingList?: boolean;
    showConsumedMeals?: boolean;
  }) => {
    console.log("Updating meal plan settings with input:", input);
    return executeMutation(updateMealPlanSettings, { input });
  };

  const updateServings = (input: {
    weekType: string;
    dayIndex: number;
    mealType: string;
    recipeId: string;
    servings: number;
  }) => {
    console.log("Updating recipe servings with input:", input);
    return executeMutation(updateRecipeServings, { input });
  };

  return {
    mealPlan: data?.mealPlan || null,
    loading: globalLoading || loading, // Use `loading` from `useQuery`
    error: globalError || error?.message || null,
    addRecipe,
    moveRecipeFromTable,
    toggleConsumed,
    removeRecipe,
    clearDayRecipes,
    clearWeekRecipes,
    duplicateMealPlanWeek,
    updateSettings,
    updateServings,
    refetch,
  };
};
