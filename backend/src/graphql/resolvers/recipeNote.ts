// src/graphql/resolvers/recipeNote.ts
import { Types } from 'mongoose';
import { RecipeNote } from '../../models/RecipeNote';
import { Recipe } from '../../models/Recipe';
import { User } from '../../models/User';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';

interface SaveNoteInput {
  recipeId: string;
  content: string;
}

export const recipeNoteResolvers = {
  Query: {
    recipeNote: async (_: never, 
      { recipeId }: { recipeId: string }, 
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);

      return RecipeNote.findOne({ 
        userId: dbUser._id,
        recipeId: new Types.ObjectId(recipeId)
      });
    },

    myRecipeNotes: async (_: never, __: never, context: Context) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);

      return RecipeNote.find({ userId: dbUser._id })
        .sort({ updatedAt: -1 });
    }
  },

  Recipe: {
    // Field resolver for myNote in Recipe type
    myNote: async (parent: { _id: Types.ObjectId }, _: never, context: Context) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) return null;

      return RecipeNote.findOne({
        userId: dbUser._id,
        recipeId: parent._id
      });
    }
  },

  Mutation: {
    saveRecipeNote: async (_: never,
      { input }: { input: SaveNoteInput },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);

      // Validate recipe exists
      const recipe = await Recipe.findById(input.recipeId);
      if (!recipe) throw new ApplicationError('Recipe not found', 404);

      // Validate content length and whitespace
      const trimmedContent = input.content.trim();
      if (!trimmedContent) {
        throw new ApplicationError('Note content cannot be empty', 400);
      }
      if (trimmedContent.length > 2000) {
        throw new ApplicationError('Note cannot exceed 2000 characters', 400);
      }

      // Update or create note
      const note = await RecipeNote.findOneAndUpdate(
        { 
          userId: dbUser._id,
          recipeId: new Types.ObjectId(input.recipeId)
        },
        {
          content: input.content.trim(),
          $setOnInsert: { createdAt: new Date() }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      return note;
    },

    deleteRecipeNote: async (_: never,
      { recipeId }: { recipeId: string },
      context: Context
    ) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);

      const result = await RecipeNote.deleteOne({
        userId: dbUser._id,
        recipeId: new Types.ObjectId(recipeId)
      });

      return result.deletedCount > 0;
    }
  }
};