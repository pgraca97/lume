// src/graphql/schema/ingredient.ts
export const ingredientTypeDefs = `#graphql
  """
  Detailed nutrition information per 100g
  """
  type IngredientNutrition {
    calories: Float!
    protein: Float!
    carbohydrates: Float!
    fat: Float!
    fiber: Float
    sugar: Float
    sodium: Float
  }

  """
  Ingredient type with detailed information and hierarchical relationships
  """
  type Ingredient {
    id: ID!
    name: String!
    slug: String!
    alternateNames: [String!]!
    image: String
    category: String!
    # Hierarchy fields
    parent: Ingredient
    variants: [Ingredient!]!
    isGeneric: Boolean!
    specificType: String
    # Base fields
    defaultUnit: String!
    validUnits: [String!]!
    nutritionPer100g: IngredientNutrition
    storage: String
    seasonality: [String!]
    isActive: Boolean!
    # Related data
    recipes(limit: Int = 10, offset: Int = 0): [Recipe!]!
    totalRecipes: Int!
  }

  extend type Query {
    """
    Get ingredient by ID
    """
    ingredient(id: ID!): Ingredient

    """
    Search ingredients with optional filters
    """
    searchIngredients(
      query: String
      category: String
      includeVariants: Boolean = false
      limit: Int = 10
      offset: Int = 0
    ): [Ingredient!]!
  }
`;
