// src/models/Review.ts
import mongoose, { Document } from "mongoose";

export interface IReview extends Document {
  recipeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  cookSnaps: string[];
  firstCooked: Date;
  lastCooked: Date;
  cookCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new mongoose.Schema(
  {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: (v: number) => Number.isInteger(v * 2),
        message: "Rating must be in 0.5 increments",
      },
    },
    comment: {
      type: String,
      maxLength: 500,
    },
    cookSnaps: {
      type: [String],
      validate: [
        {
          validator: (v: string[]) => v.length <= 8,
          message: "Maximum 8 cook snaps allowed per review",
        },
        {
          validator: (v: string[]) =>
            v.every((url) => url.startsWith("users/cooksnaps/")),
          message: "Invalid cook snap path",
        },
      ],
    },
    firstCooked: {
      type: Date,
    },
    lastCooked: {
      type: Date,
    },
    cookCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Indexes for performance
reviewSchema.index({ recipeId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ recipeId: 1, createdAt: -1 }, { name: "recipe_reviews" });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
