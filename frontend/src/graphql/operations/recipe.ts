// src/graphql/operations/recipe.ts
import { gql } from "@apollo/client";
import { RECIPE_FIELDS } from "../schema/recipe";

export const GET_RECIPE_CARD = gql`
  query GetRecipeCard($id: ID!) {
    recipe(id: $id) {
      id
      title
      subtitle
      mainImage
      costPerServing
      difficulty
      difficultyName
      prepTime
      cookTime
      description
      servings
      totalTime
      tags {
        category
        name
      }
      ingredients {
        ingredientName
        ingredient {
          name
        }
        amount
        unit
      }
      reviewStats {
        avgRating
        reviewCount
      }
    }
  }
`;

export const GET_RECIPE_DETAILS = gql`
  query GetRecipeDetails($id: ID!) {
    recipe(id: $id) {
      id
      title
      subtitle
      description
      mainImage
      images
      difficulty
      difficultyName
      prepTime
      cookTime
      totalTime
      servings
      ingredients {
        ingredient {
          id
          name
          image
          category
        }
        ingredientName
        amount
        unit
        notes
        type
        importance
        suggestedSubstitutes {
          ingredient {
            id
            name
            image
          }
          ingredientName
          notes
          conversion
        }
      }
      servingInstructions
      steps {
        order
        description
        tips
        image
        video
      }
      tags {
        category
        name
      }
      nutritionPerServing {
        calories
        protein
        carbohydrates
        fat
        fiber
        sugar
        sodium
      }
      costPerServing
      tipsAndHacks
      chefSecret
      reviewStats {
        avgRating
        reviewCount
        totalCookCount
        lastCooked
      }
      reviews {
        id
        rating
        comment
        cookSnaps
        cookSnapsUrls
        userId
        user {
          id
          profile {
            username
            profileImage
            profileImageUrl
          }
        }
        firstCooked
        lastCooked
        cookCount
      }
    }
  }
`;

export const GET_RECIPES = gql`
  query GetRecipes(
    $query: String
    $tags: [String!]
    $difficulty: Int
    $limit: Int
    $offset: Int
  ) {
    searchRecipes(
      query: $query
      tags: $tags
      difficulty: $difficulty
      limit: $limit
      offset: $offset
    ) {
      ...RecipeCardFields
    }
  }
  ${RECIPE_FIELDS}
`;

export const GET_TAGS = gql`
  query GetAllTags {
    getAllTags {
      name
      category
    }
  }
`;
