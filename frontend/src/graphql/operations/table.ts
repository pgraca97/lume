import { gql } from "@apollo/client";
import { 
  TABLE_FIELDS, 
  TABLE_STATS_FIELDS, 
  SAVED_RECIPE_FIELDS,
  COOKBOOK_STATS_FIELDS 
} from "../schema/table";

// Queries
export const GET_TABLE = gql`
  query GetTable($id: ID!) {
    table(id: $id) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const GET_MY_TABLES = gql`
  query GetMyTables($filter: MyTablesFilter, $limit: Int, $offset: Int) {
    myTables(filter: $filter, limit: $limit, offset: $offset) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const GET_SAVED_RECIPES = gql`
  query GetSavedRecipes($filter: SavedRecipesFilter, $limit: Int, $offset: Int) {
    savedRecipes(filter: $filter, limit: $limit, offset: $offset) {
      recipes {
        ...SavedRecipeFields
      }
      totalCount
      stats {
        byDifficulty {
          level
          count
        }
      }
    }
  }
  ${SAVED_RECIPE_FIELDS}
`;

export const GET_MY_TABLE_STATS = gql`
  query GetMyTableStats {
    myTableStats {
      ...TableStatsFields
    }
  }
  ${TABLE_STATS_FIELDS}
`;

export const GET_COOKBOOK_STATS = gql`
  query GetCookbookStats {
    cookbookStats {
      ...CookbookStatsFields
    }
  }
  ${COOKBOOK_STATS_FIELDS}
`;

// Mutations
export const CREATE_TABLE = gql`
  mutation CreateTable($input: CreateTableInput!) {
    createTable(input: $input) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const UPDATE_TABLE = gql`
  mutation UpdateTable($id: ID!, $input: UpdateTableInput!) {
    updateTable(id: $id, input: $input) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const DELETE_TABLE = gql`
  mutation DeleteTable($id: ID!) {
    deleteTable(id: $id)
  }
`;

export const ADD_RECIPE_TO_TABLE = gql`
  mutation AddRecipeToTable($tableId: ID!, $recipeId: ID!) {
    addRecipeToTable(tableId: $tableId, recipeId: $recipeId) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const ADD_RECIPE_TO_UNPLANNED_MEALS = gql`
  mutation AddRecipeToUnplannedMeals($recipeId: ID!) {
    addRecipeToUnplannedMeals(recipeId: $recipeId) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const REMOVE_RECIPE_FROM_TABLE = gql`
  mutation RemoveRecipeFromTable($tableId: ID!, $recipeId: ID!) {
    removeRecipeFromTable(tableId: $tableId, recipeId: $recipeId) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const ADD_TABLE_COLLABORATOR = gql`
  mutation AddTableCollaborator($input: AddCollaboratorInput!) {
    addTableCollaborator(input: $input) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const REMOVE_TABLE_COLLABORATOR = gql`
  mutation RemoveTableCollaborator($tableId: ID!, $userId: ID!) {
    removeTableCollaborator(tableId: $tableId, userId: $userId) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;

export const UPDATE_TABLE_COLLABORATOR_ROLE = gql`
  mutation UpdateTableCollaboratorRole($tableId: ID!, $userId: ID!, $role: CollaboratorRole!) {
    updateTableCollaboratorRole(tableId: $tableId, userId: $userId, role: $role) {
      ...TableFields
    }
  }
  ${TABLE_FIELDS}
`;