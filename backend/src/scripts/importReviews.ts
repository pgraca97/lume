// src/scripts/importReviews.ts
import mongoose, { Types } from "mongoose";
import { IRecipe, Recipe } from "../models/Recipe";
import { Review } from "../models/Review";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

interface ImportedReview {
  recipeId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  cookSnaps: string[];
  firstCooked: Date;
  lastCooked: Date;
  cookCount: number;
}

async function importReviews() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);

    // Read reviews JSON file
    console.log("Reading reviews data file...");
    const reviewsRaw = await fs.readFile(
      path.join(__dirname, "../../data/reviews.json"),
      "utf-8"
    );

    const reviews = JSON.parse(reviewsRaw);

    // Validate reviews data
    console.log("Validating reviews data...");
    const existingRecipeIds = (await Recipe.distinct(
      "_id"
    )) as Types.ObjectId[];
    const recipeIdsSet = new Set(existingRecipeIds.map((id) => id.toString()));

    reviews.forEach((review: ImportedReview, index: number) => {
      // Convert string IDs to ObjectIds if necessary
      if (typeof review.recipeId === "string") {
        review.recipeId = new Types.ObjectId(review.recipeId);
      }
      if (typeof review.userId === "string") {
        review.userId = new Types.ObjectId(review.userId);
      }

      // Check if recipe exists
      if (
        !mongoose.Types.ObjectId.isValid(review.recipeId) ||
        !recipeIdsSet.has(review.recipeId.toString())
      ) {
        throw new Error(
          `Review at index ${index} references non-existent or invalid recipe: ${review.recipeId}`
        );
      }

      // Validate rating
      if (
        review.rating < 1 ||
        review.rating > 5 ||
        !Number.isInteger(review.rating * 2)
      ) {
        throw new Error(
          `Invalid rating ${review.rating} for review at index ${index}`
        );
      }

      // Validate dates
      if (new Date(review.lastCooked) < new Date(review.firstCooked)) {
        throw new Error(
          `Invalid dates for review at index ${index}: lastCooked before firstCooked`
        );
      }
    });

    // Clear existing reviews
    console.log("Clearing existing reviews...");
    await Review.deleteMany({});

    // Import reviews
    console.log("Importing reviews...");
    const importedReviews = await Review.insertMany(reviews, {
      ordered: false,
    });

    // Update recipe stats
    console.log("Updating recipe statistics...");
    const recipes = (await Recipe.find({})) as IRecipe[];

    for (const recipe of recipes) {
      const recipeReviews = reviews.filter((r: ImportedReview) =>
        r.recipeId.equals(recipe._id)
      );

      if (recipeReviews.length > 0) {
        const totalRating = recipeReviews.reduce(
          (sum: number, r: ImportedReview) => sum + r.rating,
          0
        );
        const totalCooks = recipeReviews.reduce(
          (sum: number, r: ImportedReview) => sum + r.cookCount,
          0
        );
        const lastCooked = recipeReviews.reduce(
          (latest: Date | null, r: ImportedReview) =>
            !latest || new Date(r.lastCooked) > latest
              ? new Date(r.lastCooked)
              : latest,
          null
        );

        await Recipe.findByIdAndUpdate(recipe._id, {
          "reviewStats.avgRating": totalRating / recipeReviews.length,
          "reviewStats.reviewCount": recipeReviews.length,
          "reviewStats.totalCookCount": totalCooks,
          "reviewStats.lastCooked": lastCooked,
        });
      }
    }

    // Log success statistics
    console.log("\nReviews Import Statistics:");
    console.log(`✓ Successfully imported ${importedReviews.length} reviews`);

    // Log some analysis
    const recipeStats = await Recipe.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$reviewStats.avgRating" },
          totalReviews: { $sum: "$reviewStats.reviewCount" },
          totalCooks: { $sum: "$reviewStats.totalCookCount" },
        },
      },
    ]);

    if (recipeStats.length > 0) {
      console.log("\nOverall Statistics:");
      console.log(`Average Rating: ${recipeStats[0].avgRating.toFixed(2)}`);
      console.log(`Total Reviews: ${recipeStats[0].totalReviews}`);
      console.log(`Total Times Cooked: ${recipeStats[0].totalCooks}`);
    }
  } catch (error) {
    console.error("Error importing reviews:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run the import
if (require.main === module) {
  importReviews()
    .then(() => {
      console.log("\n✓ Reviews import completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n✗ Reviews import failed:", error);
      process.exit(1);
    });
}

export { importReviews };
