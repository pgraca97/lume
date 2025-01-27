// src/graphql/operations/recipeNote.ts
import { gql } from "@apollo/client";
import { RECIPE_NOTE_FIELDS } from "../schema/recipeNote";


//Save OR Update a Note
export const SAVE_RECIPE_NOTE = gql`
  mutation SaveRecipeNote($input: SaveNoteInput!) {
    saveRecipeNote(input: $input) {
      id
      recipeId
      userId
      content
      createdAt
      updatedAt
      history {
        content
        updatedAt
      }
    }
  }
`;

//Delete a note
export const DELETE_RECIPE_NOTE = gql`
  mutation DeleteRecipeNote($recipeId: ID!) {
    deleteRecipeNote(recipeId: $recipeId)
  }
`;

//Get a specific note
export const GET_RECIPE_NOTE = gql`
  query GetRecipeNote($recipeId: ID!) {
    recipeNote(recipeId: $recipeId) {
      id
      recipeId
      userId
      content
      createdAt
      updatedAt
      history {
        content
        updatedAt
      }
    }
  }
`;

//Get all users note
export const GET_MY_RECIPE_NOTES = gql`
  query GetMyRecipeNotes {
    myRecipeNotes {
      id
      recipeId
      userId
      content
      createdAt
      updatedAt
    }
  }
`;
