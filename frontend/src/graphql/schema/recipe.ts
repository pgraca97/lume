import { gql } from "@apollo/client";

export const RECIPE_FIELDS = gql`
  fragment RecipeCardFields on Recipe {
    id
    title
    subtitle
    description
    mainImage
    difficulty
    difficultyName
    prepTime
    cookTime
    totalTime
    costPerServing
    reviewStats {
      avgRating
      reviewCount
    }
    tags {
      category
      name
    }
  }
`;
