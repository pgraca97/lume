// src/graphql/schema/recipeNote.ts
export const recipeNoteTypeDefs = `#graphql
  """
  A single historical version of a note
  """
  type NoteHistory {
    content: String!
    updatedAt: DateTime!
  }

  """
  User's note for a specific recipe
  """
  type RecipeNote {
    id: ID!
    userId: ID!
    recipeId: ID!
    content: String!
    history: [NoteHistory!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Extending the Recipe type to include the note
  extend type Recipe {
    """
    Current user's note for this recipe, if it exists
    """
    myNote: RecipeNote
  }

  input SaveNoteInput {
    recipeId: ID!
    content: String!
  }

  extend type Query {
    """
    Get current user's note for a specific recipe
    """
    recipeNote(recipeId: ID!): RecipeNote

    """
    Get all recipe notes for current user
    """
    myRecipeNotes: [RecipeNote!]!
  }

  extend type Mutation {
    """
    Save or update a note for a recipe.
    Creates a new note if none exists, updates existing note otherwise.
    """
    saveRecipeNote(input: SaveNoteInput!): RecipeNote!

    """
    Delete a note for a recipe.
    Returns true if deletion was successful, false if note didn't exist.
    """
    deleteRecipeNote(recipeId: ID!): Boolean!
  }
`;

export const recipeNoteResolverTypes = {
  Recipe: {
    myNote: 'RecipeNote'
  }
};