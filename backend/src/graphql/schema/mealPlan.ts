// src/graphql/schema/mealPlan.ts
export const mealPlanTypeDefs = `#graphql
enum WeekType {
  PREVIOUS
  CURRENT
  NEXT
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

type MealRecipe {
  recipe: Recipe!
  isConsumed: Boolean!
  servings: Int!
  addedAt: DateTime!
}

type MealSlot {
  type: MealType!
  recipes: [MealRecipe!]!
}

type MealDay {
  date: DateTime!
  note: String
  meals: [MealSlot!]!
}

type MealWeek {
  type: WeekType!
  startDate: DateTime!
  days: [MealDay!]!
}

type MealTypeStats {
  total: Int!
  consumed: Int!
}

type MealPlanStats {
  totalRecipes: Int!
  consumedRecipes: Int!
  recipesByMealType: MealTypeStatsMap! 
}

type MealTypeStatsMap {
  BREAKFAST: MealTypeStats!
  LUNCH: MealTypeStats!
  DINNER: MealTypeStats!
  SNACK: MealTypeStats!
}

type MealPlanSettings {
  weekStartDay: Int!
  autoGenerateShoppingList: Boolean!
  showConsumedMeals: Boolean!
}

type MealPlan {
  id: ID!
  userId: ID!
  settings: MealPlanSettings!
  visibility: String!
  weeks: [MealWeek!]!
  stats: MealPlanStats!
  weekTransition: WeekTransitionInfo! 
  createdAt: DateTime!
  updatedAt: DateTime!
}

type WeekTransitionInfo {
  hasNewWeekStarted: Boolean!
  transitionDate: DateTime
  shouldShowNotification: Boolean!
}

input AddToMealPlanInput {
  recipeId: ID!
  weekType: WeekType!
  dayIndex: Int! # 0-6
  mealType: MealType!
  servings: Int! = 1
}

input MoveToMealPlanInput {
  tableId: ID!     # ID of the source table (e.g., Unplanned Meals table)
  recipeId: ID!
  weekType: WeekType!
  dayIndex: Int!
  mealType: MealType!
  servings: Int! = 1
}

input ToggleConsumedInput {
  weekType: WeekType!
  dayIndex: Int!
  mealType: MealType!
  recipeId: ID!
}

input ClearDayInput {
  weekType: WeekType!
  dayIndex: Int!
}

input UpdateMealPlanSettingsInput {
  weekStartDay: Int
  autoGenerateShoppingList: Boolean
  showConsumedMeals: Boolean
}

extend type Query {
  mealPlan(testDate: DateTime): MealPlan!
}

input RemoveRecipeFromMealInput {
    weekType: WeekType!
    dayIndex: Int!
    mealType: MealType!
    recipeId: ID!
  }


input UpdateRecipeServingsInput {
    weekType: WeekType!
    dayIndex: Int!
    mealType: MealType!
    recipeId: ID!
    servings: Int!
  }


extend type Mutation {
  # Adding recipes
  addRecipeToMealPlan(input: AddToMealPlanInput!): MealPlan!
  moveFromTableToMealPlan(input: MoveToMealPlanInput!): MealPlan!
  
  # Managing recipes
  toggleRecipeConsumed(input: ToggleConsumedInput!): MealPlan!
  clearDay(input: ClearDayInput!): MealPlan!
  clearWeek(weekType: WeekType!): MealPlan!

  """
  Duplicate a week's meal plan to another week
  Source and target must be different weeks
  """
  duplicateWeek(
    sourceWeek: WeekType!
    targetWeek: WeekType!
  ): MealPlan!

  
  # Settings
  updateMealPlanSettings(input: UpdateMealPlanSettingsInput!): MealPlan!

      """
    Update the servings for a specific recipe in the meal plan
    """
    updateRecipeServings(input: UpdateRecipeServingsInput!): MealPlan!

        """
    Remove a recipe from a meal slot
    """
    removeRecipeFromMeal(input: RemoveRecipeFromMealInput!): MealPlan!
}
`