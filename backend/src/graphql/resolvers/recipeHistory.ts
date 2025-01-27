// src/graphql/resolvers/recipeHistory.ts

import { Recipe } from "../../models/Recipe";
import { MIN_VIEW_DURATION, RecipeHistory } from "../../models/RecipeHistory";
import { User } from "../../models/User";
import { Context } from "../../types/context";
import { requireAuth } from "../../utils/auth";
import { ApplicationError } from "../../utils/errors";
import { GraphQLError } from 'graphql';

export const recipeHistoryResolvers = {
    Query: {
      recentlyViewedRecipes: async (_: never, __: never, context: Context) => {
        const user = requireAuth(context);
        const dbUser = await User.findOne({ firebaseUid: user.uid });
        if (!dbUser) throw new ApplicationError('User not found', 404);
  
        const history = await RecipeHistory.findOne({ userId: dbUser._id })
          .populate({
            path: 'entries.recipeId',
            match: { isActive: true }
          });
  
        if (!history) return [];
  
        return history.entries
          .filter(entry => entry.recipeId) // Filter out deleted recipes
          .map(entry => ({
            recipe: entry.recipeId,
            viewedAt: entry.viewedAt,
            viewDuration: entry.viewDuration
          }));
      }
    },
  
    Mutation: {
      addToHistory: async (_: never, 
        { recipeId, viewDuration }: { recipeId: string; viewDuration: number }, 
        context: Context
      ) => {
        try {
          // Validate inputs
          if (viewDuration < 0) {
            throw new ApplicationError(
              'View duration cannot be negative', 
              400,
              { code: 'INVALID_DURATION' }
            );
          }
  
          const user = requireAuth(context);
          const dbUser = await User.findOne({ firebaseUid: user.uid });
          if (!dbUser) {
            throw new ApplicationError(
              'User not found', 
              404,
              { code: 'USER_NOT_FOUND' }
            );
          }
  
          // Validate recipe
          const recipe = await Recipe.findOne({ _id: recipeId, isActive: true });
          if (!recipe) {
            throw new ApplicationError(
              'Recipe not found or inactive', 
              404,
              { code: 'RECIPE_NOT_FOUND' }
            );
          }
  
          // Find or create history document
          let history = await RecipeHistory.findOne({ userId: dbUser._id });
          
          if (!history) {
            history = new RecipeHistory({
              userId: dbUser._id,
              entries: []
            });
          }
  
          // Remove existing entry if present
          history.entries = history.entries.filter(
            entry => !entry.recipeId.equals(recipe._id)
          );
  
          // Add new entry
          history.entries.unshift({
            recipeId: recipe._id,
            viewedAt: new Date(),
            viewDuration
          });
  
          // Check view duration before saving
          if (viewDuration < MIN_VIEW_DURATION) {
            return {
              success: false,
              message: `View duration must be at least ${MIN_VIEW_DURATION} seconds`
            };
          }
  
          await history.save();
          return { 
            success: true,
            message: 'Recipe added to history'
          };
        } catch (error) {
          // Convert ApplicationError to GraphQLError
          if (error instanceof ApplicationError) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.details?.code || 'HISTORY_ERROR',
                ...error.details
              }
            });
          }
          
          // Handle unexpected errors
          console.error('Error updating recipe history:', error);
          throw new GraphQLError('Failed to update recipe history', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR'
            }
          });
        }
      },
  
      clearHistory: async (_: never, __: never, context: Context) => {
        try {
          const user = requireAuth(context);
          const dbUser = await User.findOne({ firebaseUid: user.uid });
          if (!dbUser) {
            throw new ApplicationError(
              'User not found', 
              404,
              { code: 'USER_NOT_FOUND' }
            );
          }
      
          // Find the history document
          let history = await RecipeHistory.findOne({ userId: dbUser._id });
      
          if (!history || history.entries.length === 0) {
            // No history or no entries
            return {
              success: true,
              message: 'History is already empty'
            };
          } else {
            // Clear the entries
            history.entries = [];
            await history.save();
            return {
              success: true,
              message: 'History cleared successfully'
            };
          }
        } catch (error) {
          if (error instanceof ApplicationError) {
            throw new GraphQLError(error.message, {
              extensions: {
                code: error.details?.code || 'CLEAR_HISTORY_ERROR',
                ...error.details
              }
            });
          }
          
          console.error('Error clearing recipe history:', error);
          throw new GraphQLError('Failed to clear recipe history', {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR'
            }
          });
        }
      }
    }
  };