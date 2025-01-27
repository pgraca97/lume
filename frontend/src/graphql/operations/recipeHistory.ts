import { gql } from "@apollo/client";
import { RECIPE_FIELDS } from "../schema/recipe";

export const GET_RECIPE_HISTORY = gql`
  query GetRecentlyViewedRecipes {
    recentlyViewedRecipes {
      recipe {
        ...RecipeCardFields
      }
      viewedAt
      viewDuration
    }
  }
  ${RECIPE_FIELDS}
`;

export const ADD_TO_HISTORY = gql`
  mutation AddToHistory($recipeId: ID!, $viewDuration: Int!) {
    addToHistory(recipeId: $recipeId, viewDuration: $viewDuration) {
      success
      message
    }
  }
`;

export const CLEAR_HISTORY = gql`
  mutation ClearHistory {
    clearHistory {
      success
      message
    }
  }
`;