import { gql } from "@apollo/client";
import { MEAL_PLAN_FIELDS, MEAL_WEEK_FIELDS } from "../schema/mealPlan";

//Get the full meal plan
export const GET_MEAL_PLAN = gql`
  query GetMealPlan($testDate: DateTime) {
    mealPlan(testDate: $testDate) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Add recipe to the meal plan
export const ADD_RECIPE_TO_MEAL_PLAN = gql`
  mutation AddRecipeToMealPlan($input: AddToMealPlanInput!) {
    addRecipeToMealPlan(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Move the recipe from the collection to the meal plan
export const MOVE_FROM_TABLE_TO_MEAL_PLAN = gql`
  mutation MoveFromTableToMealPlan($input: MoveToMealPlanInput!) {
    moveFromTableToMealPlan(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Check/Uncheck if the user consume or not the meal
export const TOGGLE_RECIPE_CONSUMED = gql`
  mutation ToggleRecipeConsumed($input: ToggleConsumedInput!) {
    toggleRecipeConsumed(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Clear recipes for the day
export const CLEAR_DAY = gql`
  mutation ClearDay($input: ClearDayInput!) {
    clearDay(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Clear recipes from that week
export const CLEAR_WEEK = gql`
  mutation ClearWeek($weekType: WeekType!) {
    clearWeek(weekType: $weekType) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Doubles meals of one week to another
export const DUPLICATE_WEEK = gql`
  mutation DuplicateWeek($sourceWeek: WeekType!, $targetWeek: WeekType!) {
    duplicateWeek(sourceWeek: $sourceWeek, targetWeek: $targetWeek) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Update the meal setting
export const UPDATE_MEAL_PLAN_SETTINGS = gql`
  mutation UpdateMealPlanSettings($input: UpdateMealPlanSettingsInput!) {
    updateMealPlanSettings(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

//Update the number of servings of the recipe
export const UPDATE_RECIPE_SERVINGS = gql`
  mutation UpdateRecipeServings($input: UpdateRecipeServingsInput!) {
    updateRecipeServings(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;

export const REMOVE_RECIPE_MEAL = gql`
  mutation RemoveRecipeFromMeal($input: RemoveRecipeFromMealInput!) {
    removeRecipeFromMeal(input: $input) {
      ...MealPlanFields
    }
  }
  ${MEAL_PLAN_FIELDS}
`;
