import { gql } from '@apollo/client';

export const TABLE_FIELDS = gql`
  fragment TableFields on Table {
    id
    title
    subtitle
    emoji
    privacy
    owner {
      id
      email
      profile {
        username
        profileImage
      }
    }
    collaborators {
      user {
        id
        email
        profile {
          username
          profileImage
        }
      }
      role
      addedAt
      addedBy {
        id
        email
      }
    }
    recipes {
      recipe {
        id
        title
        difficulty
        reviewStats {
          avgRating
          reviewCount
        }
      }
      addedAt
      addedBy {
        id
      }
    }
    recentThumbnails
    recipeCount
    isCollaborator
    canEdit
    myRole
    createdAt
    updatedAt
    lastActivityAt
  }
`;

export const TABLE_STATS_FIELDS = gql`
  fragment TableStatsFields on TableStats {
    totalTables
    groupTables
    secretTables
    publicTables
    privateTables
  }
`;

export const SAVED_RECIPE_FIELDS = gql`
  fragment SavedRecipeFields on SavedRecipe {
    recipe {
      id
      title
      difficulty
      reviewStats {
        avgRating
        reviewCount
      }
      tags {
        name
      }
      createdAt
    }
    savedAt
    tableId
    tableName
  }
`;

export const COOKBOOK_STATS_FIELDS = gql`
  fragment CookbookStatsFields on CookbookStats {
    unplannedMeals {
      exists
      recipeCount
      tableId
    }
    savedRecipes {
      total
      tableCount
    }
  }
`;