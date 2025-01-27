// src/graphql/schema/recipe.ts
export const recipeTypeDefs = `#graphql
"""
Review type representing a user's feedback on a recipe
"""
type Review {
  id: ID!
  recipeId: ID!
  userId: ID!
  user: User
  rating: Float!
  comment: String
  cookSnaps: [String!]!
  cookSnapsUrls: [String!]
  firstCooked: String
  lastCooked: String
  cookCount: Int!
  createdAt: String!
  updatedAt: String!
}

"""
Recipe review statistics
"""
type ReviewStats {
  avgRating: Float!
  reviewCount: Int!
  totalCookCount: Int!
  lastCooked: String
}

input CookSnapUploadInput {
  filename: String!
  contentType: String!
  size: Int!
}

input updateReviewImagesInput {
  reviewId: ID!
  imagesToAdd: [String!]
  imagesToRemove: [String!]
}

type CookSnapUploadPayload {
  uploadUrl: String!
  blobPath: String!
}

"""
Suggested substitute for a recipe ingredient
"""
type IngredientSubstitute {
  ingredient: Ingredient
  ingredientName: String
  notes: String
  conversion: String
}


"""
Recipe ingredient with optional reference to Ingredient collection
"""
type RecipeIngredient {
  ingredient: Ingredient       # Optional reference to Ingredient
  ingredientName: String      # For non-referenced ingredients
  amount: Float!
  unit: String!
  notes: String
  type: String!
  importance: String!
  suggestedSubstitutes: [IngredientSubstitute!]
}

"""
Serving suggestions for the recipe
"""
type ServingSuggestions {
  description: String
  suggestedIngredients: [SuggestedIngredient!]!
}

"""
Additional suggested ingredient for serving
"""
type SuggestedIngredient {
  name: String!              # Changed from ingredient to name since these aren't references
  amount: Float
  unit: String
  notes: String
  category: ServingSuggestionCategory!
}

"""
Category for serving suggestions
"""
enum ServingSuggestionCategory {
  ESSENTIAL
  OPTIONAL
}

type CookingStep {
  order: Int!
  description: String!
  tips: String
  image: String
  video: String
}

type RecipeTag {
  category: String!
  name: String!
}

type NutritionInfo {
  calories: Float!
  protein: Float!
  carbohydrates: Float!
  fat: Float!
  fiber: Float
  sugar: Float
  sodium: Float
}

"""
Recipe type representing a cooking recipe
"""
type Recipe {
  id: ID!
  title: String!
  subtitle: String
  description: String!
  mainImage: String!
  images: [String!]!
  difficulty: Int!
  difficultyName: String!
  prepTime: Int!
  cookTime: Int!
  totalTime: Int!
  servings: Int!
  ingredients: [RecipeIngredient!]!
  servingInstructions: String
  steps: [CookingStep!]!
  tags: [RecipeTag!]!
  nutritionPerServing: NutritionInfo!
  costPerServing: Float!
  tipsAndHacks: String
  chefSecret: String
  reviewStats: ReviewStats!
  reviews: [Review!]!
  recommendedPairings: [Recipe!]
  cookingStats: RecipeCookingStats!
  isActive: Boolean!
  createdAt: String!
  updatedAt: String!
}

"""
Detailed cooking statistics for a recipe
"""
type RecipeCookingStats {
  totalCookCount: Int!
  cookModeSessions: Int!
  mealPlanCompletions: Int!
  manualCompletions: Int!
  uniqueUsers: Int!
  averageServings: Float
  lastCooked: DateTime
}

"""
Response for review deletion
"""
type DeleteReviewResponse {
  success: Boolean!
  message: String
}



type Query {
  """
  Get a recipe by ID
  """
  recipe(id: ID!): Recipe
  
  """
  Search recipes with optional filters
  """
  searchRecipes(
    query: String
    tags: [String!]
    difficulty: Int
    limit: Int = 10
    offset: Int = 0
  ): [Recipe!]!

  """
  Retrieve all available tags across all recipes
  """
  getAllTags: [RecipeTag!]!
}

type Mutation {
  """
  Add a review to a recipe
  """
  addReview(
    recipeId: ID!
    rating: Float!
    comment: String
    cookSnaps: [String!]
  ): Review!
  
  getCookSnapUploadUrl(input: CookSnapUploadInput!): CookSnapUploadPayload!
  
  """
  Manage review images (add/remove/reorder)
  """
  updateReviewImages(input: updateReviewImagesInput!): Review!
  
  """
  Update review rating and comment
  """
  updateReview(
    reviewId: ID!
    rating: Float
    comment: String
  ): Review!
  
  """
  Delete a review
  """
  deleteReview(reviewId: ID!): DeleteReviewResponse!
}


`;
