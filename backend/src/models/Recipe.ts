// src/models/Recipe.ts
import mongoose, { Document, Types } from "mongoose";
import {
  DifficultyLevel,
  TagCategory,
  DIFFICULTY_NAMES,
  SYSTEM_TAGS,
} from "./enums/RecipeEnums";

const recipeIngredientSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: false,
    },
    ingredientName: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, "Ingredient name must be at least 2 characters long"],
      maxlength: [100, "Ingredient name cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, "Ingredient notes cannot exceed 200 characters"],
    },
    type: {
      type: String,
      enum: ["CORE", "TOPPING", "GARNISH"],
      default: "CORE",
    },
    importance: {
      type: String,
      enum: ["REQUIRED", "RECOMMENDED", "OPTIONAL"],
      default: "REQUIRED",
    },
    suggestedSubstitutes: [
      {
        ingredient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          required: false,
        },
        ingredientName: {
          type: String,
          required: false,
          trim: true,
          minlength: [2, "Name must be at least 2 characters long"],
          maxlength: [100, "Name cannot exceed 100 characters"],
        },
        notes: String,
        conversion: String,
      },
    ],
  },
  {
    _id: false,
    validateBeforeSave: true,
  }
);

// Validação para ingrediente principal
recipeIngredientSchema.pre("validate", function (next) {
  if (!this.ingredient && !this.ingredientName) {
    this.invalidate(
      "ingredient",
      "Either ingredient reference or ingredientName must be provided"
    );
  }

  // Validar substitutos
  if (this.suggestedSubstitutes && this.suggestedSubstitutes.length > 0) {
    this.suggestedSubstitutes.forEach((substitute, index) => {
      if (!substitute.ingredient && !substitute.ingredientName) {
        this.invalidate(
          `suggestedSubstitutes.${index}`,
          "Either ingredient reference or ingredientName must be provided for substitute"
        );
      }
    });
  }

  next();
});

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    images: [String],
    mainImage: {
      type: String,
      required: true,
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      validate: {
        validator: (v: number) => Object.values(DifficultyLevel).includes(v),
        message: "Invalid difficulty level",
      },
    },
    prepTime: {
      type: Number,
      required: true,
      min: [1, "Prep time must be at least 1 minute"],
      max: [480, "Prep time cannot exceed 8 hours"],
    },
    cookTime: {
      type: Number,
      required: true,
      min: [0, "Cook time cannot be negative"],
      max: [1440, "Cook time cannot exceed 24 hours"],
    },
    totalTime: {
      type: Number,
      required: true,
      default: function (this: any) {
        return (this.prepTime || 0) + (this.cookTime || 0);
      },
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    ingredients: {
      type: [recipeIngredientSchema],
      validate: {
        validator: function (ingredients: any[]) {
          const hasCoreRequired = ingredients.some(
            (ing) => ing.type === "CORE" && ing.importance === "REQUIRED"
          );
          return (
            ingredients.length >= 1 &&
            ingredients.length <= 30 &&
            hasCoreRequired
          );
        },
        message: "Must have 1-30 ingredients with at least one CORE REQUIRED",
      },
    },
    servingInstructions: String,
    steps: {
      type: [
        {
          order: Number,
          description: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 1000,
          },
          tips: String,
          image: {
            type: String,
            validate: {
              validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
              message: "Image URL must be valid",
            },
          },
          video: {
            type: String,
            validate: {
              validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
              message: "Video URL must be valid",
            },
          },
        },
      ],
      _id: false,
    },
    tags: {
      type: [
        {
          category: {
            type: String,
            enum: Object.values(TagCategory),
            required: true,
          },
          name: {
            type: String,
            required: true,
            validate: {
              validator: function (this: any, value: string) {
                const category = this.get("category") as TagCategory;
                return SYSTEM_TAGS[
                  category as keyof typeof SYSTEM_TAGS
                ]?.includes(value);
              },
              message: "Invalid tag for category",
            },
            name: {
              type: String,
              required: true,
              validate: {
                validator: function (this: any, value: string) {
                  const category = this.get("category") as TagCategory;
                  return SYSTEM_TAGS[
                    category as keyof typeof SYSTEM_TAGS
                  ]?.includes(value);
                },
                message: "Invalid tag for category",
              },
            },
          },
        },
      ],
      validate: [
        {
          validator: (v: any[]) => v.length >= 2 && v.length <= 6,
          message: "Must have 2-6 tags",
        },
        {
          validator: (v: any[]) =>
            v.some(
              (tag) =>
                tag.category === TagCategory.MOMENT ||
                tag.category === TagCategory.OCCASION
            ),
          message: "Must have at least one timing tag",
        },
      ],
      required: true,
      _id: false,
    },
    nutritionPerServing: {
      calories: { type: Number, required: true, min: 0 },
      protein: { type: Number, required: true, min: 0 },
      carbohydrates: { type: Number, required: true, min: 0 },
      fat: { type: Number, required: true, min: 0 },
      fiber: { type: Number, min: 0 },
      sugar: { type: Number, min: 0 },
      sodium: { type: Number, min: 0 },
    },
    costPerServing: {
      type: Number,
      required: true,
      min: 0,
      max: 1000,
    },
    tipsAndHacks: String,
    chefSecret: String,
    reviewStats: {
      avgRating: { type: Number, default: 0, min: 0, max: 5 },
      reviewCount: { type: Number, default: 0, min: 0 },
      totalCookCount: { type: Number, default: 0, min: 0 },
      lastCooked: { type: Date, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Indexes
recipeSchema.index({ title: "text", description: "text" });
recipeSchema.index({ "tags.name": 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ "reviewStats.avgRating": -1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index(
  {
    isActive: 1,
    "reviewStats.avgRating": -1,
    createdAt: -1,
  },
  {
    name: "recipe_card_listing",
  }
);
recipeSchema.index(
  {
    isActive: 1,
    "tags.name": 1,
    difficulty: 1,
  },
  { name: "recipe_search" }
);

// Virtuals
recipeSchema.virtual("difficultyName").get(function () {
  return DIFFICULTY_NAMES[this.difficulty as DifficultyLevel];
});

// Interface
export interface IRecipe extends Document {
  _id: Types.ObjectId;
  title: string;
  subtitle?: string;
  description: string;
  images: string[];
  mainImage: string;
  difficulty: number;
  difficultyName: string;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Array<{
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
  }>;
  servingInstructions?: string;
  steps: Array<{
    order: number;
    description: string;
    tips?: string;
    image?: string;
    video?: string;
  }>;
  tags: Array<{
    category: TagCategory;
    name: string;
  }>;
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  costPerServing: number;
  tipsAndHacks?: string;
  chefSecret?: string;
  reviewStats: {
    avgRating: number;
    reviewCount: number;
    totalCookCount: number;
    lastCooked?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Recipe = mongoose.model<IRecipe>("Recipe", recipeSchema);
