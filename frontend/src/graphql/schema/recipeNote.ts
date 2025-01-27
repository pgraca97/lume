import { gql } from '@apollo/client';

export const RECIPE_NOTE_FIELDS = gql`
  fragment RecipeNoteFields on RecipeNote {
    id
    userId
    recipeId
    content
    history {
      content
      updatedAt
    }
    createdAt
    updatedAt
  }
`;
