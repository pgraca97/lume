// src/hooks/useRecipeHistory.ts
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_RECIPE_HISTORY,
  ADD_TO_HISTORY,
  CLEAR_HISTORY,
} from "../graphql/operations/recipeHistory";

export const useRecipeHistory = () => {
  // Query for recipe history
  const { 
    data, 
    loading: historyLoading, 
    error: historyError,
    refetch: refetchHistory 
  } = useQuery(GET_RECIPE_HISTORY, {
    fetchPolicy: "cache-and-network",
  });

  // Add to history mutation
  const [addToHistory] = useMutation(ADD_TO_HISTORY, {
    refetchQueries: [{ query: GET_RECIPE_HISTORY }],
  });

  // Clear history mutation
  const [clearHistory] = useMutation(CLEAR_HISTORY, {
    refetchQueries: [{ query: GET_RECIPE_HISTORY }],
  });

  // Transform data to match RecipeCard requirements
  const recentRecipes = data?.recentlyViewedRecipes?.map(({ recipe }) => ({
    id: recipe.id,
    title: recipe.title,
    mainImage: recipe.mainImage,
    subtitle: recipe.subtitle,
    costPerServing: recipe.costPerServing,
    difficulty: recipe.difficulty,
    totalTime: recipe.totalTime,
  })) || [];

  return {
    recentRecipes,
    historyLoading,
    historyError,
    refetchHistory,
    addToHistory,
    clearHistory,
  };
};