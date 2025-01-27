import { gql } from '@apollo/client';

//Describe the arguments that each recipe should have
export const MEAL_RECIPE_FIELDS = gql`
  fragment MealRecipeFields on MealRecipe {
    recipe {
      id
      title
    }
    isConsumed
    servings
    addedAt
  }
`;

//Type of meal (if is a breakfast or lunch or dinner) with a list of recipes (using the meal_recipe_fields)
export const MEAL_SLOT_FIELDS = gql`
  fragment MealSlotFields on MealSlot {
    type
    recipes {
      ...MealRecipeFields
    }
  }
  ${MEAL_RECIPE_FIELDS}
`;

//Represents a day in the meal plan with the date of the day, a note and the meal_slot (types of meals and the list)
export const MEAL_DAY_FIELDS = gql`
  fragment MealDayFields on MealDay {
    date
    note
    meals {
      ...MealSlotFields
    }
  }
  ${MEAL_SLOT_FIELDS}
`;

//Represent a week in the meal plan, with the type of the week, the start day of that week and a list of days (using the meal_day_fields)
export const MEAL_WEEK_FIELDS = gql`
  fragment MealWeekFields on MealWeek {
    type
    startDate
    days {
      ...MealDayFields
    }
  }
  ${MEAL_DAY_FIELDS}
`;

//This puts all together, so it has the settings of the meal plan, the weeks and stats
export const MEAL_PLAN_FIELDS = gql`
  fragment MealPlanFields on MealPlan {
    id
    settings {
      weekStartDay
      autoGenerateShoppingList
      showConsumedMeals
    }
    weeks {
      ...MealWeekFields
    }
    stats {
      totalRecipes
      consumedRecipes
      recipesByMealType {
        BREAKFAST {
          total
          consumed
        }
        LUNCH {
          total
          consumed
        }
        DINNER {
          total
          consumed
        }
        SNACK {
          total
          consumed
        }
      }
    }
  }
  ${MEAL_WEEK_FIELDS}
`;
