// src/graphql/resolvers/recipe.ts
import { Types } from 'mongoose';
import { Recipe, IRecipe } from '../../models/Recipe';
import { IReview, Review } from '../../models/Review';
import { ApplicationError } from '../../utils/errors';
import { azureStorage } from '../../config/azureStorage';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { IUser, User } from '../../models/User';
import { CompletionSource, CookingSession, SessionStatus } from '../../models/CookingSession';

interface SearchRecipesArgs {
  query?: string;
  tags?: string[];
  difficulty?: number;
  limit?: number;
  offset?: number;
}

interface RecipeIngredient {
  ingredient?: Types.ObjectId;
  ingredientName?: string;
  amount: number;
  unit: string;
  notes?: string;
  type: "CORE" | "TOPPING" | "GARNISH";
  importance: "REQUIRED" | "RECOMMENDED" | "OPTIONAL";
  suggestedSubstitutes?: Array<{
    ingredient?: Types.ObjectId;
    ingredientName?: string;
    notes?: string;
    conversion?: string;
  }>;
}

interface AddReviewArgs {
  recipeId: string;
  rating: number;
  comment?: string;
  cookSnaps?: string[];
}

export const recipeResolvers = {
  Query: {
    recipe: async (_: never, { id }: { id: string }) => {
      const recipe = await Recipe.findById(id)
        .populate("ingredients.ingredient")
        .populate("ingredients.suggestedSubstitutes.ingredient");

      if (!recipe || !recipe.isActive) {
        throw new ApplicationError("Recipe not found", 404);
      }

      const recipeObj = recipe.toObject();

      // Process images with SAS tokens
      if (recipeObj.mainImage) {
        recipeObj.mainImage = azureStorage.getSecureUrl(recipeObj.mainImage);
      }

      if (recipeObj.images?.length) {
        recipeObj.images = recipeObj.images.map((img) =>
          azureStorage.getSecureUrl(img)
        );
      }

      if (recipeObj.steps) {
        recipeObj.steps = recipeObj.steps.map((step) => ({
          ...step,
          image: step.image ? azureStorage.getSecureUrl(step.image) : undefined,
          video: step.video ? azureStorage.getSecureUrl(step.video) : undefined,
        }));
      }

      return recipeObj;
    },

    searchRecipes: async (
      _: never,
      { query, tags, difficulty, limit = 10, offset = 0 }: SearchRecipesArgs
    ) => {
      const filter: any = { isActive: true };
    
      if (query) {
        // Check if the query is a comma-separated list of IDs
        if (query.includes(",")) {
          const ids = query.split(",").map((id) => new Types.ObjectId(id.trim()));
          filter._id = { $in: ids };
        } else {
          // Fallback to text search for non-ID queries
          filter.$text = { $search: query };
        }
      }
    
      if (tags?.length) {
        filter["tags.name"] = { $in: tags };
      }
    
      if (difficulty) {
        filter.difficulty = difficulty;
      }
    
      const recipes = await Recipe.find(filter)
        .sort({ "reviewStats.avgRating": -1 })
        .skip(offset)
        .limit(limit);
    
      return recipes.map((recipe) => {
        const recipeObj = recipe.toObject();
        if (recipeObj.mainImage) {
          recipeObj.mainImage = azureStorage.getSecureUrl(recipeObj.mainImage);
        }
        return recipeObj;
      });
    },

    getAllTags: async () => {
      // Aggregate all tags from the Recipe collection
      const tags = await Recipe.aggregate([
        { $unwind: "$tags" }, // Unwind the tags array
        { $group: { _id: "$tags", count: { $sum: 1 } } }, // Group by tag and count occurrences
        { $project: { _id: 0, category: "$_id.category", name: "$_id.name" } }, // Format output
        { $sort: { category: 1, name: 1 } }, // Optional: sort by category and name
      ]);

      return tags;
    },
  },

  Recipe: {
    ingredients: async (parent: IRecipe) => {
      // Process ingredients, ensuring proper types and handling
      return parent.ingredients.map((ing: RecipeIngredient) => ({
        ...ing,
        amount: Number(ing.amount),
        type: ing.type || "CORE",
        importance: ing.importance || "REQUIRED",
      }));
    },

    reviews: async (parent: IRecipe) => {
      return Review.find({ recipeId: parent._id }).sort({ createdAt: -1 });
    },

    cookingStats: async (parent: IRecipe) => {
      const [
          cookModeCount,
          mealPlanCount,
          manualCount,
          uniqueUsersCount,
          avgServingsResult
      ] = await Promise.all([
          CookingSession.countDocuments({
              recipeId: parent._id,
              status: SessionStatus.COMPLETED,
              completionSource: CompletionSource.COOK_MODE
          }),
          CookingSession.countDocuments({
              recipeId: parent._id,
              status: SessionStatus.COMPLETED,
              completionSource: CompletionSource.MEAL_PLAN
          }),
          CookingSession.countDocuments({
              recipeId: parent._id,
              status: SessionStatus.COMPLETED,
              completionSource: CompletionSource.MANUAL
          }),
          CookingSession.distinct('userId', {
              recipeId: parent._id,
              status: SessionStatus.COMPLETED
          }).then(users => users.length),
          CookingSession.aggregate([
              { 
                  $match: { 
                      recipeId: parent._id,
                      status: SessionStatus.COMPLETED
                  }
              },
              { 
                  $group: {
                      _id: null,
                      avgServings: { $avg: '$servings' }
                  }
              }
          ])
      ]);

      const avgServings = avgServingsResult[0]?.avgServings || 0;

      return {
          totalCookCount: cookModeCount + mealPlanCount + manualCount,
          cookModeSessions: cookModeCount,
          mealPlanCompletions: mealPlanCount,
          manualCompletions: manualCount,
          uniqueUsers: uniqueUsersCount,
          averageServings: Math.round(avgServings * 10) / 10, // Round to 1 decimal
          lastCooked: parent.reviewStats.lastCooked
      };
  },

    
    /*     recommendedPairings: async (parent: IRecipe) => {
    if (!parent.recommendedPairings?.length) return null;
    
    const pairings = await Recipe.find({
    _id: { $in: parent.recommendedPairings },
    isActive: true
    }).limit(6);
    
    return pairings.map(recipe => ({
    ...recipe.toObject(),
    mainImage: recipe.mainImage ? 
    azureStorage.getSecureUrl(recipe.mainImage) : null
    }));
    } */ // to be implemented
  },

  Review: {
    user: async (parent: IReview) => {
      return await User.findById(parent.userId);
    },
    cookSnapsUrls: async (parent: IReview) => {
      return parent.cookSnaps.map((img) => azureStorage.getSecureUrl(img));
    },
  },

  Mutation: {
    // Add a new review to a recipe
    addReview: async (
      _: never,
      { recipeId, rating, comment, cookSnaps }: AddReviewArgs,
      context: Context
    ) => {
      const dbUser = await reviewHelpers.validateUser(context);

      // Validate recipe exists and is active
      const recipe = await Recipe.findById(recipeId);
      if (!recipe?.isActive) {
        throw new ApplicationError("Recipe not found", 404);
      }

      // Create review
      const review = await Review.create({
        recipeId,
        userId: dbUser._id,
        rating,
        comment,
        cookSnaps: cookSnaps || [],
        firstCooked: new Date(),
        lastCooked: new Date(),
        cookCount: 1,
      });

      // Update recipe statistics
      await reviewHelpers.updateRecipeStats(recipe._id);

      return review;
    },

    // Get secure URL for cooksnap upload
    getCookSnapUploadUrl: async (
      _: never,
      {
        input,
      }: { input: { filename: string; contentType: string; size: number } },
      context: Context
    ) => {
      const user = requireAuth(context);

      // Validate file metadata
      if (!input.filename || !input.contentType || !input.size) {
        throw new ApplicationError("Missing required file metadata", 400);
      }

      // Validate file constraints
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(input.contentType)) {
        throw new ApplicationError(
          "Invalid file type. Only JPEG, PNG, and WebP allowed.",
          400
        );
      }

      if (input.size > maxSize) {
        throw new ApplicationError("File too large. Maximum size is 5MB.", 400);
      }

      // Generate Azure storage path and URL
      const blobPath = azureStorage.generateStoragePath(
        input.filename,
        "users/cooksnaps",
        user.uid
      );

      return {
        uploadUrl: azureStorage.getSecureUrl(blobPath),
        blobPath,
      };
    },

    // Update review images (add/remove)
    updateReviewImages: async (
      _: never,
      {
        input,
      }: {
        input: {
          reviewId: string;
          imagesToAdd: string[];
          imagesToRemove: string[];
        };
      },
      context: Context
    ) => {
      const dbUser = await reviewHelpers.validateUser(context);
      const review = await reviewHelpers.validateReviewOwnership(
        input.reviewId,
        dbUser._id
      );

      let updatedCookSnaps = [...review.cookSnaps];

      // Process images to remove
      if (input.imagesToRemove?.length) {
        for (const img of input.imagesToRemove) {
          if (!updatedCookSnaps.includes(img)) {
            throw new ApplicationError(`Image ${img} not found in review`, 400);
          }
          try {
            await azureStorage.deleteBlob(img);
            updatedCookSnaps = updatedCookSnaps.filter((snap) => snap !== img);
          } catch (error) {
            console.error(`Failed to delete image ${img}:`, error);
            throw new ApplicationError("Failed to delete image", 500);
          }
        }
      }

      // Add new images
      if (input.imagesToAdd?.length) {
        updatedCookSnaps = [...updatedCookSnaps, ...input.imagesToAdd];
      }

      // Validate images limit
      if (updatedCookSnaps.length > 8) {
        throw new ApplicationError("Maximum 8 images allowed per review", 400);
      }

      return Review.findByIdAndUpdate(
        input.reviewId,
        { cookSnaps: updatedCookSnaps },
        { new: true }
      );
    },

    // Update review content (rating/comment)
    updateReview: async (
      _: never,
      {
        reviewId,
        rating,
        comment,
      }: {
        reviewId: string;
        rating?: number;
        comment?: string;
      },
      context: Context
    ) => {
      const dbUser = await reviewHelpers.validateUser(context);
      const review = await reviewHelpers.validateReviewOwnership(
        reviewId,
        dbUser._id
      );

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new ApplicationError("Rating must be between 1 and 5", 400);
      }

      // Update review
      const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
          ...(rating !== undefined && { rating }),
          ...(comment !== undefined && { comment }),
          updatedAt: new Date(),
        },
        { new: true }
      );

      // Update recipe stats if rating changed
      if (rating !== undefined && rating !== review.rating) {
        await reviewHelpers.updateRecipeStats(review.recipeId);
      }

      return updatedReview;
    },

    // Delete review and associated resources
    deleteReview: async (
      _: never,
      { reviewId }: { reviewId: string },
      context: Context
    ) => {
      const dbUser = await reviewHelpers.validateUser(context);
      const review = await reviewHelpers.validateReviewOwnership(
        reviewId,
        dbUser._id
      );

      // Delete associated cooksnaps
      if (review.cookSnaps?.length) {
        for (const cookSnap of review.cookSnaps) {
          try {
            await azureStorage.deleteBlob(cookSnap);
          } catch (error) {
            console.error(`Failed to delete image ${cookSnap}:`, error);
          }
        }
      }

      // Delete review
      await Review.findByIdAndDelete(reviewId);

      // Update recipe statistics
      await reviewHelpers.updateRecipeStats(review.recipeId);

      return {
        success: true,
        message: "Review successfully deleted",
      };
    },
  },
};

// Helper functions for recipe reviews
const reviewHelpers = {
  // Update recipe statistics when reviews change
  async updateRecipeStats(recipeId: Types.ObjectId) {
    const reviews = await Review.find({ recipeId });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    await Recipe.findByIdAndUpdate(recipeId, {
      "reviewStats.avgRating": avgRating,
      "reviewStats.reviewCount": reviews.length,
      "reviewStats.totalCookCount": reviews.length,
      "reviewStats.lastCooked":
        reviews.length > 0
          ? Math.max(...reviews.map((r) => r.lastCooked.getTime()))
          : null,
    });
  },

  // Validate and get user from context
  async validateUser(context: Context) {
    const user = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: user.uid });
    if (!dbUser) {
      throw new ApplicationError("User not found", 404);
    }
    return dbUser;
  },

  // Validate review ownership
  async validateReviewOwnership(reviewId: string, userId: Types.ObjectId) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ApplicationError("Review not found", 404);
    }
    if (!review.userId.equals(userId)) {
      throw new ApplicationError("Not authorized to modify this review", 403);
    }
    return review;
  },
};