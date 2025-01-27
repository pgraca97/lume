// src/hooks/useRecipe.ts
import { useQuery, useMutation } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GET_RECIPE_CARD,
  GET_RECIPE_DETAILS,
} from "../graphql/operations/recipe";

// Types for our hook
interface UseRecipeProps {
  id: string;
}

interface ReviewInput {
  rating: number;
  comment?: string;
  cookSnaps?: string[];
}

export const useRecipe = ({ id }: UseRecipeProps) => {
  // Query for recipe card (preview)
  const {
    data: cardData,
    loading: cardLoading,
    error: cardError,
  } = useQuery(GET_RECIPE_CARD, {
    variables: { id },
    // Skip fetching if no id is provided
    skip: !id,
    // Cache recipe cards for 5 minutes
    fetchPolicy: "cache-first",
  });

  // Query for full recipe details
  const {
    data: detailsData,
    loading: detailsLoading,
    error: detailsError,
    refetch: refetchDetails,
  } = useQuery(GET_RECIPE_DETAILS, {
    variables: { id },
    skip: !id,
    // Don't cache full details as much since they might change more often
    fetchPolicy: "cache-and-network",
  });

  return {
    // Recipe card data
    recipeCard: cardData?.recipe,
    cardLoading,
    cardError,

    // Full recipe details
    recipeDetails: detailsData?.recipe,
    detailsLoading,
    detailsError,
    refetchDetails,
  };
};

// src/hooks/useRecipeList.ts
export const useRecipeList = (p0: {}) => {
  // Cache management for recipe lists
  const updateListCache = async (recipes: any[]) => {
    try {
      await AsyncStorage.setItem(
        "@recipe_list_cache",
        JSON.stringify({
          data: recipes,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error updating recipe list cache:", error);
    }
  };

  // You can add more functionality here for handling recipe lists
  // like filtering, sorting, etc.

  return {
    updateListCache,
  };
};
