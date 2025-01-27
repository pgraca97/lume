// src/graphql/schema/recipeHistory.ts
export const recipeHistoryTypeDefs = `#graphql
  """
  Single entry in recipe viewing history
  """
  type HistoryEntry {
    """
    The viewed recipe details
    """
    recipe: Recipe!
    
    """
    When the recipe was viewed
    """
    viewedAt: DateTime!
    
    """
    Duration of view in seconds
    """
    viewDuration: Int!
  }

  """
  Response for recipe history mutation
  """
  type AddToHistoryResponse {
    """
    Success status of the operation
    """
    success: Boolean!
    
    """
    Additional context about the operation
    """
    message: String
  }

  type RecipeHistory {
    entries: [HistoryEntry!]!
  }

  extend type Query {
    """
    Get recent recipe history (last 10 viewed recipes)
    """
    recentlyViewedRecipes: [HistoryEntry!]!
  }

  """
  Response for clearing history
  """
  type ClearHistoryResponse {
    """
    Success status of the operation
    """
    success: Boolean!
    
    """
    Additional context about the operation
    """
    message: String
  }

  extend type Mutation {
    """
    Add or update recipe in view history
    """
    addToHistory(
      recipeId: ID!
      viewDuration: Int!
    ): AddToHistoryResponse!

    """
    Clear recipe history
    """
    clearHistory: ClearHistoryResponse!
  }
`;