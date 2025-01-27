import { useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GET_RECIPES } from "../graphql/operations/recipe";

interface UseRecipeListProps {
  query?: string;
  tags?: string[];
  difficulty?: number;
  limit?: number;
  offset?: number;
}

interface UseRecipeListResult {
  recipes: any[] | undefined;
  recipesLoading: boolean;
  recipesError: Error | undefined;
  refetchRecipes: () => void;
  updateListCache: (recipes: any[]) => Promise<void>;
}

export const useRecipeList = ({
  query,
  tags,
  difficulty,
  limit = 10,
  offset = 0,
}: UseRecipeListProps): UseRecipeListResult => {
  // Query for fetching recipe list
  const {
    data: recipesData,
    loading: recipesLoading,
    error: recipesError,
    refetch: refetchRecipes,
  } = useQuery(GET_RECIPES, {
    variables: {
      query,
      tags,
      difficulty,
      limit,
      offset,
      sortBy: "createdAt",
      order: "desc",
    },
    fetchPolicy: "cache-and-network",
  });

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

  // Optional: Save the fetched list to cache when data is loaded
  if (recipesData?.searchRecipes) {
    updateListCache(recipesData.searchRecipes);
  }

  return {
    recipes: recipesData?.searchRecipes,
    recipesLoading,
    recipesError,
    refetchRecipes,
    updateListCache,
  };
};
