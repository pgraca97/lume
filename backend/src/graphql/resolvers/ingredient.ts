// src/graphql/resolvers/ingredient.ts
import { Types } from 'mongoose';
import { Recipe } from '../../models/Recipe';
import { Ingredient, IIngredient } from '../../models/Ingredient';
import { ApplicationError } from '../../utils/errors';

interface SearchIngredientsArgs {
  query?: string;
  category?: string;
  includeVariants?: boolean;
  limit?: number;
  offset?: number;
}

interface RecipeFilterArgs {
  limit?: number;
  offset?: number;
}

export const ingredientResolvers = {
  Query: {
    ingredient: async (_: never, { id }: { id: string }) => {
      const ingredient = await Ingredient.findById(id);
      
      if (!ingredient || !ingredient.isActive) {
        throw new ApplicationError('Ingredient not found', 404);
      }
      
      return ingredient;
    },

    searchIngredients: async (_: never, { 
      query, 
      category, 
      includeVariants = false,
      limit = 10,
      offset = 0 
    }: SearchIngredientsArgs) => {
      const filter: Record<string, any> = { 
        isActive: true,
        ...(category && { category }),
        ...(includeVariants ? {} : { isGeneric: true })
      };

      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { alternateNames: { $regex: query, $options: 'i' } },
          { specificType: { $regex: query, $options: 'i' } }
        ];
      }

      return Ingredient.find(filter)
        .sort({ name: 1 })
        .skip(offset)
        .limit(limit);
    }
  },

  Ingredient: {
    // Get all variants of a generic ingredient
    variants: async (parent: IIngredient) => {
      if (!parent.isGeneric || !parent.variants?.length) return [];
      
      return Ingredient.find({ 
        _id: { $in: parent.variants },
        isActive: true 
      });
    },

    // Get parent ingredient for variants
    parent: async (parent: IIngredient) => {
      if (!parent.parentIngredient) return null;
      
      return Ingredient.findById(parent.parentIngredient);
    },

    // Get recipes using this ingredient or its variants
    recipes: async (parent: IIngredient, { limit = 10, offset = 0 }: RecipeFilterArgs) => {
      const ingredientIds = [parent._id];
      
      // Include variants if this is a generic ingredient
      if (parent.isGeneric && parent.variants?.length) {
        ingredientIds.push(...parent.variants);
      }

      return Recipe
        .find({
          'ingredients.ingredient': { $in: ingredientIds },
          isActive: true
        })
        .sort({ 'reviewStats.avgRating': -1 })
        .skip(offset)
        .limit(limit);
    },

    // Count total recipes using this ingredient or its variants
    totalRecipes: async (parent: IIngredient) => {
      const ingredientIds = [parent._id];
      
      if (parent.isGeneric && parent.variants?.length) {
        ingredientIds.push(...parent.variants);
      }

      return Recipe.countDocuments({
        'ingredients.ingredient': { $in: ingredientIds },
        isActive: true
      });
    }
  }
};
