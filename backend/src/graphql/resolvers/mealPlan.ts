// src/graphql/resolvers/mealPlan.ts
import { Types } from "mongoose";
import { Context } from "../../types/context";
import { requireAuth } from "../../utils/auth";
import { ApplicationError } from "../../utils/errors";
import {
  MealPlan,
  WeekType,
  MealType,
  IMealPlan,
  IMealWeek,
  IMealPlanStats,
  IMealSlot,
} from "../../models/MealPlan";
import { IRecipe, Recipe } from "../../models/Recipe";
import { CollaboratorRole, Table } from "../../models/Table";
import { User } from "../../models/User";
import { GraphQLError } from "graphql";
import {
  IShoppingListDocument,
  ItemCategory,
  ItemUnit,
  ListStatus,
  ListType,
  ShoppingList,
} from "../../models/ShoppingList";
import { IIngredient, Ingredient } from "../../models/Ingredient";

interface AddToMealPlanInput {
  recipeId: string;
  weekType: WeekType;
  dayIndex: number;
  mealType: MealType;
  servings: number;
}

interface MoveToMealPlanInput {
  tableId: string;
  recipeId: string;
  weekType: WeekType;
  dayIndex: number;
  mealType: MealType;
  servings: number;
}

interface ToggleConsumedInput {
  weekType: WeekType;
  dayIndex: number;
  mealType: MealType;
  recipeId: string;
}

interface ClearDayInput {
  weekType: WeekType;
  dayIndex: number;
}

interface DuplicateWeekInput {
  sourceWeek: WeekType;
  targetWeek: WeekType;
}

export const mealPlanResolvers = {
  Query: {
    mealPlan: async (
      _: never,
      { testDate }: { testDate?: string },
      context: Context
    ) => {
      try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError("User not found", 404);

        // Find or create meal plan
        let mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        const now = testDate ? new Date(testDate) : new Date();
        let hasTransitioned = false;

        if (!mealPlan) {
          mealPlan = await initializeMealPlan(dbUser._id);
        } else {
          const currentWeek = mealPlan.weeks.find(
            (w) => w.type === WeekType.CURRENT
          );
          if (currentWeek && hasWeekEnded(currentWeek.startDate)) {
            hasTransitioned = true;
            const transitionedPlan = await transitionWeeks(mealPlan);
            if (!transitionedPlan)
              throw new ApplicationError("Failed to transition weeks", 500);
            mealPlan = transitionedPlan;

            // Generate shopping list after successful transition
            await handleWeekTransition(mealPlan);
          }
        }

        // Handle document conversion safely
        const mealPlanObj = mealPlan.toObject();
        const lastNotified = mealPlan.lastWeekTransitionNotified;

        return {
          ...mealPlanObj,
          id: mealPlan.id,
          weekTransition: {
            hasNewWeekStarted: hasTransitioned,
            transitionDate: hasTransitioned ? now : null,
            shouldShowNotification:
              hasTransitioned &&
              (!lastNotified ||
                now.getTime() - new Date(lastNotified).getTime() >
                  24 * 60 * 60 * 1000),
          },
        };
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.details?.code || "MEAL_PLAN_ERROR",
              ...error.details,
            },
          });
        }
        throw error;
      }
    },

    /*         mealPlan: async (_: never, 
        { testDate }: { testDate?: string },
        context: Context
        ) => {
        try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError('User not found', 404);
        
        let mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        const now = testDate ? new Date(testDate) : new Date();
        
        let hasTransitioned = false;
        let transitionDate = null;
        
        if (!mealPlan) {
        mealPlan = await initializeMealPlan(dbUser._id);
        } else {
        const currentWeek = mealPlan.weeks.find(w => w.type === WeekType.CURRENT);
        
        if (currentWeek && hasWeekEnded(currentWeek.startDate, now)) {
        transitionDate = now;
        hasTransitioned = true;
        mealPlan = await transitionWeeks(mealPlan);
        
        // Update lastWeekTransitionNotified if user hasn't been notified in 24h
        
        const lastNotified = mealPlan.lastWeekTransitionNotified;
        if (!lastNotified || 
        now.getTime() - lastNotified.getTime() > 24 * 60 * 60 * 1000) {
        mealPlan = await MealPlan.findByIdAndUpdate(
        mealPlan._id,
        { lastWeekTransitionNotified: now },
        { new: true }
        );
        }
        }
        }
        
        // Add weekTransition info to response
        const lastNotified = mealPlan.lastWeekTransitionNotified;
        const shouldShowNotification = hasTransitioned && 
        (!lastNotified || now.getTime() - lastNotified.getTime() <= 24 * 60 * 60 * 1000);
        
        return {
        ...mealPlan.toObject(),
        weekTransition: {
        hasNewWeekStarted: hasTransitioned,
        transitionDate: transitionDate,
        shouldShowNotification
        }
        };
        } catch (error) {
        if (error instanceof ApplicationError) {
        throw new GraphQLError(error.message, {
        extensions: {
        code: error.details?.code || 'MEAL_PLAN_ERROR',
        ...error.details
        }
        });
        }
        throw error;
        }
        
        } */
  },

  // Field resolvers
  MealRecipe: {
    recipe: async (parent: { recipeId: Types.ObjectId }) => {
      return Recipe.findById(parent.recipeId);
    },
  },

  Mutation: {
    addRecipeToMealPlan: async (
      _: never,
      { input }: { input: AddToMealPlanInput },
      context: Context
    ) => {
      try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError("User not found", 404);

        // Validate recipe exists
        const recipe = (await Recipe.findById(
          input.recipeId
        )) as IRecipe | null;
        if (!recipe || !recipe.isActive) {
          throw new ApplicationError("Recipe not found", 404);
        }

        // Get or create meal plan
        let mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        if (!mealPlan) {
          mealPlan = await initializeMealPlan(dbUser._id);
        }

        // Check if week type is PREVIOUS
        if (input.weekType === WeekType.PREVIOUS) {
          throw new ApplicationError("Cannot add meals to previous week", 400, {
            code: "INVALID_WEEK",
          });
        }

        // Get target day's date
        const targetWeek = mealPlan.weeks.find(
          (w) => w.type === input.weekType
        );
        if (!targetWeek) {
          throw new ApplicationError("Invalid week type", 400);
        }

        // Validate input
        if (input.dayIndex < 0 || input.dayIndex > 6) {
          throw new ApplicationError("Invalid day index", 400);
        }

        const targetDate = targetWeek.days[input.dayIndex].date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if trying to add to a past date
        if (targetDate < today) {
          throw new ApplicationError("Cannot add meals to past dates", 400, {
            code: "PAST_DATE",
          });
        }

        const nextWeek = mealPlan.weeks.find((w) => w.type === WeekType.NEXT);
        if (!nextWeek)
          throw new ApplicationError("Invalid meal plan structure", 500);
        const endOfNextWeek = new Date(nextWeek.startDate);
        endOfNextWeek.setDate(endOfNextWeek.getDate() + 6); // End of next week (Sunday)

        // Check if trying to add beyond NEXT week
        if (targetDate > endOfNextWeek) {
          throw new ApplicationError(
            "Cannot add meals beyond the next week",
            400,
            { code: "FUTURE_DATE" }
          );
        }

        // Find the correct week and meal
        const weekIndex = mealPlan.weeks.findIndex(
          (w) => w.type === input.weekType
        );
        if (weekIndex === -1) {
          throw new ApplicationError("Invalid week type", 400);
        }

        const dayIndex = input.dayIndex;
        const mealIndex = mealPlan.weeks[weekIndex].days[
          dayIndex
        ].meals.findIndex((m) => m.type === input.mealType);

        if (mealIndex === -1) {
          throw new ApplicationError("Invalid meal type", 400);
        }

        // Check recipe limit
        const currentRecipes =
          mealPlan.weeks[weekIndex].days[dayIndex].meals[mealIndex].recipes;
        if (currentRecipes.length >= 4) {
          throw new ApplicationError(
            "Maximum recipes per meal slot reached",
            400
          );
        }

        // Check for existing recipe
        const existingRecipe = currentRecipes.find(
          (recipe) => recipe.recipeId.toString() === input.recipeId
        );

        if (existingRecipe) {
          throw new ApplicationError(
            "Recipe already exists in this meal slot. " +
              "Current servings: " +
              existingRecipe.servings +
              ". " +
              "Use updateRecipeServings mutation to adjust portions.",
            400,
            {
              code: "DUPLICATE_RECIPE",
              currentServings: existingRecipe.servings,
            }
          );
        }

        // Add recipe to the mealPlan
        mealPlan.weeks[weekIndex].days[dayIndex].meals[mealIndex].recipes.push({
          recipeId: new Types.ObjectId(input.recipeId),
          isConsumed: false,
          servings: input.servings,
          addedAt: new Date(),
        });

        await mealPlan.save();

        // Fetch the updated mealPlan from the database
        mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        if (!mealPlan) throw new ApplicationError("Meal plan not found", 404);

        // If adding to current week and autoGenerateShoppingList is enabled, update shopping list
        if (
          input.weekType === WeekType.CURRENT &&
          mealPlan.settings.autoGenerateShoppingList
        ) {
          await generateMealPlanList(dbUser._id, mealPlan);
        }

        return mealPlan;
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.details?.code,
              ...error.details,
            },
          });
        }
        throw error;
      }
    },

    updateRecipeServings: async (
      _: never,
      {
        input,
      }: {
        input: {
          weekType: WeekType;
          dayIndex: number;
          mealType: MealType;
          recipeId: string;
          servings: number;
        };
      },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError("User not found", 404);

      if (input.servings <= 0 || input.servings > 12) {
        throw new ApplicationError("Servings must be between 1 and 12", 400);
      }

      // First find the meal plan
      const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
      if (!mealPlan) throw new ApplicationError("Meal plan not found", 404);

      // Find the correct week, day, meal and recipe
      const weekIndex = mealPlan.weeks.findIndex(
        (w) => w.type === input.weekType
      );
      if (weekIndex === -1)
        throw new ApplicationError("Invalid week type", 400);

      const targetDay = mealPlan.weeks[weekIndex].days[input.dayIndex];
      const mealIndex = targetDay.meals.findIndex(
        (m) => m.type === input.mealType
      );
      if (mealIndex === -1)
        throw new ApplicationError("Invalid meal type", 400);

      const recipeIndex = targetDay.meals[mealIndex].recipes.findIndex(
        (r) => r.recipeId.toString() === input.recipeId
      );
      if (recipeIndex === -1)
        throw new ApplicationError("Recipe not found in this meal slot", 404);

      // Update the servings
      mealPlan.weeks[weekIndex].days[input.dayIndex].meals[mealIndex].recipes[
        recipeIndex
      ].servings = input.servings;

      // Save and return updated meal plan
      return await mealPlan.save();
    },

    moveFromTableToMealPlan: async (
      _: never,
      { input }: { input: MoveToMealPlanInput },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError("User not found", 404);

      // Validate table and access
      const table = await Table.findOne({
        _id: input.tableId,
        "collaborators.userId": dbUser._id,
        "collaborators.role": CollaboratorRole.OWNER,
        title: "Unplanned Meals",
      });
      if (!table) {
        throw new ApplicationError("Table not found", 404);
      }

      // Check if user has access to the table
      const hasAccess = table.collaborators.some(
        (c) => c.userId.toString() === dbUser._id.toString()
      );
      if (!hasAccess) {
        throw new ApplicationError("Not authorized to access this table", 403);
      }

      // Check if recipe exists in table
      const recipeExists = table.recipes.some(
        (r) => r.recipeId.toString() === input.recipeId
      );
      if (!recipeExists) {
        throw new ApplicationError("Recipe not found in table", 404);
      }

      // Add to meal plan
      const result = await mealPlanResolvers.Mutation.addRecipeToMealPlan(
        _,
        {
          input: {
            recipeId: input.recipeId,
            weekType: input.weekType,
            dayIndex: input.dayIndex,
            mealType: input.mealType,
            servings: input.servings,
          },
        },
        context
      );

      // Remove from table - using findOne and save to trigger middleware
      table.recipes = table.recipes.filter(
        (recipe) => recipe.recipeId.toString() !== input.recipeId
      );
      table.lastActivityAt = new Date();

      await table.save(); // the .save triggers the pre-save middleware

      return result;
    },

    toggleRecipeConsumed: async (
      _: never,
      { input }: { input: ToggleConsumedInput },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError("User not found", 404);

      const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
      if (!mealPlan) {
        throw new ApplicationError("Meal plan not found", 404);
      }

      // Find and toggle the recipe
      const weekIndex = mealPlan.weeks.findIndex(
        (w) => w.type === input.weekType
      );
      const meals = mealPlan.weeks[weekIndex].days[input.dayIndex].meals;
      const mealIndex = meals.findIndex((m) => m.type === input.mealType);
      const recipeIndex = meals[mealIndex].recipes.findIndex(
        (r) => r.recipeId.toString() === input.recipeId
      );

      if (recipeIndex === -1) {
        throw new ApplicationError("Recipe not found in meal plan", 404);
      }

      mealPlan.weeks[weekIndex].days[input.dayIndex].meals[mealIndex].recipes[
        recipeIndex
      ].isConsumed =
        !mealPlan.weeks[weekIndex].days[input.dayIndex].meals[mealIndex]
          .recipes[recipeIndex].isConsumed;

      return await mealPlan.save();
    },

    clearDay: async (
      _: never,
      { input }: { input: ClearDayInput },
      context: Context
    ) => {
      try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError("User not found", 404);

        const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        if (!mealPlan) {
          throw new ApplicationError("Meal plan not found", 404);
        }

        const weekIndex = mealPlan.weeks.findIndex(
          (w) => w.type === input.weekType
        );
        if (weekIndex === -1) {
          throw new ApplicationError("Invalid week type", 400);
        }

        // Check if there are any recipes to clear
        const dayMeals = mealPlan.weeks[weekIndex].days[input.dayIndex].meals;
        const hasRecipes = dayMeals.some((meal) => meal.recipes.length > 0);

        if (!hasRecipes) {
          throw new ApplicationError("No recipes to clear for this day", 400, {
            code: "DAY_ALREADY_EMPTY",
          });
        }

        // Clear all recipes from all meals in the specified day
        mealPlan.weeks[weekIndex].days[input.dayIndex].meals.forEach(
          (meal) => (meal.recipes = [])
        );

        return await mealPlan.save();
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.details?.code,
              ...error.details,
            },
          });
        }
        throw error;
      }
    },

    clearWeek: async (
      _: never,
      { weekType }: { weekType: WeekType },
      context: Context
    ) => {
      try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError("User not found", 404);

        const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        if (!mealPlan) {
          throw new ApplicationError("Meal plan not found", 404);
        }

        const weekIndex = mealPlan.weeks.findIndex((w) => w.type === weekType);
        if (weekIndex === -1) {
          throw new ApplicationError("Invalid week type", 400);
        }

        // Check if there are any recipes to clear in the week
        const hasRecipes = mealPlan.weeks[weekIndex].days.some((day) =>
          day.meals.some((meal) => meal.recipes.length > 0)
        );

        if (!hasRecipes) {
          throw new ApplicationError("No recipes to clear for this week", 400, {
            code: "WEEK_ALREADY_EMPTY",
          });
        }

        // Clear all recipes from all meals in all days of the specified week
        mealPlan.weeks[weekIndex].days.forEach((day) =>
          day.meals.forEach((meal) => (meal.recipes = []))
        );

        return await mealPlan.save();
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.details?.code,
              ...error.details,
            },
          });
        }
        throw error;
      }
    },

    updateMealPlanSettings: async (
      _: never,
      {
        input,
      }: {
        input: {
          weekStartDay?: number;
          autoGenerateShoppingList?: boolean;
          showConsumedMeals?: boolean;
        };
      },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError("User not found", 404);

      let mealPlan = await MealPlan.findOne({ userId: dbUser._id });
      if (!mealPlan) throw new ApplicationError("Meal plan not found", 404);

      // If weekStartDay is being changed, we need to recalculate weeks
      if (
        input.weekStartDay !== undefined &&
        input.weekStartDay !== mealPlan.settings.weekStartDay
      ) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate new week dates based on new start day
        const currentWeekStart = getWeekStart(today, input.weekStartDay);
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        // Create new weeks structure
        mealPlan.weeks = [
          createWeek(WeekType.PREVIOUS, previousWeekStart),
          createWeek(WeekType.CURRENT, currentWeekStart),
          createWeek(WeekType.NEXT, nextWeekStart),
        ];
      }

      // Update settings
      mealPlan.settings = {
        ...mealPlan.settings,
        ...(input.weekStartDay !== undefined && {
          weekStartDay: input.weekStartDay,
        }),
        ...(input.autoGenerateShoppingList !== undefined && {
          autoGenerateShoppingList: input.autoGenerateShoppingList,
        }),
        ...(input.showConsumedMeals !== undefined && {
          showConsumedMeals: input.showConsumedMeals,
        }),
      };

      return await mealPlan.save();
    },

    duplicateWeek: async (
      _: never,
      { sourceWeek, targetWeek }: DuplicateWeekInput,
      context: Context
    ) => {
      try {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError("User not found", 404);

        // Get meal plan
        const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
        if (!mealPlan) throw new ApplicationError("Meal plan not found", 404);

        // Check if week has already been duplicated
        if (mealPlan.lastWeekTransitionNotified) {
          throw new ApplicationError(
            "Week has already been duplicated. Cannot duplicate multiple times.",
            400,
            {
              code: "ALREADY_DUPLICATED",
              lastDuplicatedAt: mealPlan.lastWeekTransitionNotified,
            }
          );
        }

        // Rest of validation
        if (sourceWeek === targetWeek) {
          throw new ApplicationError(
            "Source and target weeks must be different",
            400,
            { code: "INVALID_DUPLICATION" }
          );
        }

        // Find source and target weeks
        const sourceWeekData = mealPlan.weeks.find(
          (w) => w.type === sourceWeek
        );
        const targetWeekIndex = mealPlan.weeks.findIndex(
          (w) => w.type === targetWeek
        );

        if (!sourceWeekData) {
          throw new ApplicationError("Source week not found", 404);
        }
        if (targetWeekIndex === -1) {
          throw new ApplicationError("Target week not found", 404);
        }

        // Cannot duplicate to PREVIOUS or NEXT week
        if (targetWeek === WeekType.PREVIOUS || targetWeek === WeekType.NEXT) {
          throw new ApplicationError(
            "Can only duplicate to current week",
            400,
            { code: "INVALID_TARGET_WEEK" }
          );
        }

        // Deep clone the days array with new dates
        const targetWeekStart = mealPlan.weeks[targetWeekIndex].startDate;
        const clonedDays = sourceWeekData.days.map((day, index) => {
          const targetDate = new Date(targetWeekStart);
          targetDate.setDate(targetDate.getDate() + index);

          return {
            date: targetDate,
            note: day.note,
            meals: cloneMealSlots(day.meals),
          };
        });

        // Update target week with cloned data and set lastWeekTransitionNotified
        const now = new Date();
        const updatedMealPlan = await MealPlan.findByIdAndUpdate(
          mealPlan._id,
          {
            $set: {
              [`weeks.${targetWeekIndex}.days`]: clonedDays,
              lastWeekTransitionNotified: now,
            },
          },
          { new: true }
        );

        // If target is current week and autoGenerate is enabled, update shopping list
        if (
          targetWeek === WeekType.CURRENT &&
          mealPlan.settings.autoGenerateShoppingList
        ) {
          if (updatedMealPlan) {
            await generateMealPlanList(dbUser._id, updatedMealPlan);
          } else {
            throw new ApplicationError("Failed to update meal plan", 500);
          }
        }

        if (!updatedMealPlan)
          throw new ApplicationError("Failed to update meal plan", 500);

        // Convert to object and add weekTransition info
        const mealPlanObj = updatedMealPlan.toObject();
        return {
          ...mealPlanObj,
          id: updatedMealPlan.id,
          weekTransition: {
            hasNewWeekStarted: false,
            transitionDate: null,
            shouldShowNotification: false,
          },
        };
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new GraphQLError(error.message, {
            extensions: {
              code: error.details?.code || "DUPLICATION_ERROR",
              ...error.details,
            },
          });
        }
        throw error;
      }
    },

    removeRecipeFromMeal: async (
      _: never,
      {
        input,
      }: {
        input: {
          weekType: WeekType;
          dayIndex: number;
          mealType: MealType;
          recipeId: string;
        };
      },
      context: Context
    ) => {
      const dbUser = await getAuthUser(context);

      // Get meal plan
      const mealPlan = await MealPlan.findOne({ userId: dbUser._id });
      if (!mealPlan) throw new ApplicationError("Meal plan not found", 404);

      // Find the correct week and validate indexes
      const weekIndex = mealPlan.weeks.findIndex(
        (w) => w.type === input.weekType
      );
      if (weekIndex === -1)
        throw new ApplicationError("Invalid week type", 400);

      if (input.dayIndex < 0 || input.dayIndex > 6) {
        throw new ApplicationError("Invalid day index", 400);
      }

      // Find the meal and recipe
      const day = mealPlan.weeks[weekIndex].days[input.dayIndex];
      const mealIndex = day.meals.findIndex((m) => m.type === input.mealType);

      if (mealIndex === -1) {
        throw new ApplicationError("Invalid meal type", 400);
      }

      // Remove the recipe
      const recipeIndex = day.meals[mealIndex].recipes.findIndex(
        (r) => r.recipeId.toString() === input.recipeId
      );

      if (recipeIndex === -1) {
        throw new ApplicationError("Recipe not found in meal slot", 404);
      }

      // Remove the recipe from the array
      mealPlan.weeks[weekIndex].days[input.dayIndex].meals[
        mealIndex
      ].recipes.splice(recipeIndex, 1);

      // Save and return updated meal plan
      await mealPlan.save();
      return mealPlan;
    },
  },
};

// Helper function to initialize a new meal plan
async function initializeMealPlan(userId: Types.ObjectId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate week dates
  const currentWeekStart = getWeekStart(today, 1); // Monday start
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  // Create empty weeks structure
  const weeks = [
    createWeek(WeekType.PREVIOUS, previousWeekStart),
    createWeek(WeekType.CURRENT, currentWeekStart),
    createWeek(WeekType.NEXT, nextWeekStart),
  ];

  const mealPlan = await MealPlan.create({
    userId,
    weeks,
    settings: {
      weekStartDay: 1, // Monday
      autoGenerateShoppingList: true,
      showConsumedRecipes: true,
    },
    visibility: "PRIVATE",
  });

  // Generate initial shopping list if autoGenerateShoppingList is enabled
  if (mealPlan.settings.autoGenerateShoppingList) {
    await generateMealPlanList(userId, mealPlan);
  }

  return mealPlan;
}

function createWeek(type: WeekType, startDate: Date) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      meals: Object.values(MealType).map((type) => ({
        type,
        recipes: [],
      })),
    });
  }
  return { type, startDate, days };
}

function getWeekStart(date: Date, startDay: number) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < startDay ? 7 : 0) + day - startDay;
  result.setDate(result.getDate() - diff);
  return result;
}

function hasWeekEnded(weekStartDate: Date, testDate?: Date): boolean {
  const now = testDate || new Date();
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return now >= weekEnd;
}

async function transitionWeeks(mealPlan: IMealPlan) {
  const oldCurrentWeek = mealPlan.weeks.find(
    (w: IMealWeek) => w.type === WeekType.CURRENT
  );
  const oldNextWeek = mealPlan.weeks.find(
    (w: IMealWeek) => w.type === WeekType.NEXT
  );

  if (!oldCurrentWeek || !oldNextWeek) {
    throw new ApplicationError("Invalid meal plan structure", 500);
  }

  const newNextStart = new Date(oldNextWeek.startDate);
  newNextStart.setDate(newNextStart.getDate() + 7);

  const updatedWeeks = mealPlan.weeks.map((week: IMealWeek) => {
    if (week.type === WeekType.PREVIOUS) {
      // Previous week becomes archive of current
      return {
        type: WeekType.PREVIOUS,
        startDate: oldCurrentWeek.startDate,
        days: oldCurrentWeek.days.map((day) => ({
          ...day,
          meals: day.meals.map((meal) => ({
            ...meal,
            recipes: meal.recipes, // Keep all recipe data including consumed status
          })),
        })),
      };
    }
    if (week.type === WeekType.CURRENT) {
      // Next week becomes current
      return {
        type: WeekType.CURRENT,
        startDate: oldNextWeek.startDate,
        days: oldNextWeek.days.map((day) => ({
          ...day,
          meals: day.meals.map((meal) => ({
            ...meal,
            recipes: meal.recipes.map((recipe) => ({
              ...recipe,
              isConsumed: false, // Reset consumed status for new current week
            })),
          })),
        })),
      };
    }
    if (week.type === WeekType.NEXT) {
      // Create fresh next week
      return createWeek(WeekType.NEXT, newNextStart);
    }

    return week;
  });

  return await MealPlan.findByIdAndUpdate(
    mealPlan._id,
    { $set: { weeks: updatedWeeks } },
    { new: true }
  );
}

function getDateForDayIndex(weekType: WeekType, dayIndex: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get start of current week
  const currentWeekStart = getWeekStart(today, 1); // Using existing getWeekStart function

  // Calculate target week start based on weekType
  const targetWeekStart = new Date(currentWeekStart);
  switch (weekType) {
    case WeekType.PREVIOUS:
      targetWeekStart.setDate(targetWeekStart.getDate() - 7);
      break;
    case WeekType.NEXT:
      targetWeekStart.setDate(targetWeekStart.getDate() + 7);
      break;
    // CURRENT week uses currentWeekStart as is
  }

  // Add dayIndex to get target date
  const targetDate = new Date(targetWeekStart);
  targetDate.setDate(targetDate.getDate() + dayIndex);
  return targetDate;
}

// Helper function to deep clone meal slots
function cloneMealSlots(meals: IMealSlot[]): IMealSlot[] {
  return meals.map((meal) => ({
    type: meal.type,
    recipes: meal.recipes.map((recipe) => ({
      recipeId: recipe.recipeId,
      isConsumed: false, // Reset consumed status in duplicate
      servings: recipe.servings,
      addedAt: new Date(), // New addition date
    })),
  }));
}

// Helper function for categorizing ingredients
function getShoppingCategory(ingredient: IIngredient | null): ItemCategory {
  if (!ingredient || !ingredient.category) return ItemCategory.OTHER;

  switch (ingredient.category) {
    case "meat":
    case "fish":
    case "vegetables":
    case "fruits":
    case "dairy":
      return ItemCategory.FRESH;

    case "grains":
    case "spices":
    case "condiments":
      return ItemCategory.GROCERY;

    default:
      return ItemCategory.OTHER;
  }
}

// Helper function to handle week transition shopping list generation
async function handleWeekTransition(mealPlan: IMealPlan): Promise<void> {
  if (mealPlan.settings.autoGenerateShoppingList) {
    const currentWeek = mealPlan.weeks.find((w) => w.type === WeekType.CURRENT);
    if (!currentWeek) return;

    const hasRecipes = currentWeek.days.some((day) =>
      day.meals.some((meal) => meal.recipes.length > 0)
    );

    if (hasRecipes) {
      await generateMealPlanList(mealPlan.userId, mealPlan);
    }
  }
}

// Helper function to calculate adjusted ingredient amount
function calculateAdjustedAmount(
  ingredientAmount: number,
  mealPlanServings: number,
  recipeDefaultServings: number
): number {
  // If recipe is set for 4 servings but meal plan uses 2,
  // we multiply by (2/4) = 0.5
  const servingRatio = mealPlanServings / recipeDefaultServings;
  return ingredientAmount * servingRatio;
}

const unitMapping: { [key: string]: ItemUnit } = {
  piece: ItemUnit.UNIT,
  tbsp: ItemUnit.UNIT,
  tsp: ItemUnit.UNIT,
  cloves: ItemUnit.UNIT,
  pinch: ItemUnit.UNIT,
  g: ItemUnit.GRAM,
  kg: ItemUnit.KILOGRAM,
  ml: ItemUnit.MILLILITER,
  l: ItemUnit.LITER,
  //  other mappings as needed
};

// Helper function to generate shopping list from meal plan
async function generateMealPlanList(
  userId: Types.ObjectId,
  mealPlan: IMealPlan
): Promise<IShoppingListDocument> {
  const currentWeek = mealPlan.weeks.find((w) => w.type === WeekType.CURRENT);
  if (!currentWeek) throw new ApplicationError("Current week not found", 404);

  // Delete any existing meal plan list for this week
  await ShoppingList.deleteMany({
    userId,
    listType: ListType.MEAL_PLAN,
    mealPlanWeekId: mealPlan.id,
  });

  const ingredients = new Map();

  // Process all recipes in the week
  for (const day of currentWeek.days) {
    for (const meal of day.meals) {
      for (const recipe of meal.recipes) {
        const recipeDetails = await Recipe.findById(recipe.recipeId);
        if (!recipeDetails) continue;

        for (const ing of recipeDetails.ingredients) {
          const key = ing.ingredient
            ? ing.ingredient.toString()
            : ing.ingredientName;

          if (!key) continue;

          let category = ItemCategory.OTHER;
          if (ing.ingredient) {
            const ingredientDetails = await Ingredient.findById(ing.ingredient);
            category = getShoppingCategory(ingredientDetails);
          }

          const quantityNote = `${ing.amount} ${ing.unit} per serving (${recipe.servings} servings)`;

          const existing = ingredients.get(key);
          if (existing) {
            existing.notes = existing.notes
              ? `${existing.notes}\n${quantityNote}`
              : quantityNote;
            existing.recipeIds.push(recipe.recipeId);
          } else {
            ingredients.set(key, {
              ingredient: ing.ingredient,
              customName: ing.ingredientName,
              quantity: null, // Set to null for MEAL_PLAN
              unit: null, // Set to null for MEAL_PLAN
              category,
              notes: quantityNote,
              recipeIds: [recipe.recipeId],
            });
          }
        }
      }
    }
  }

  return ShoppingList.create({
    userId,
    title: `Meal Plan - Week of ${formatDate(currentWeek.startDate)}`,
    status: ListStatus.ACTIVE,
    listType: ListType.MEAL_PLAN,
    mealPlanWeekId: mealPlan.id,
    items: Array.from(ingredients.values()).map((ing) => ({
      ingredient: ing.ingredient,
      customName: ing.customName,
      quantity: null, // Explicitly null for MEAL_PLAN
      unit: null, // Explicitly null for MEAL_PLAN
      category: ing.category,
      note: ing.notes,
      isCompleted: false,
      addedBy: userId,
      addedAt: new Date(),
    })),
  });
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

const getAuthUser = async (context: Context) => {
  const user = requireAuth(context);
  const dbUser = await User.findOne({ firebaseUid: user.uid });
  if (!dbUser) throw new ApplicationError("User not found", 404);
  return dbUser;
};
