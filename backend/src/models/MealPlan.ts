// src/models/MealPlan.ts
import mongoose, {Document, Types} from "mongoose";

export enum WeekType {
    PREVIOUS = 'PREVIOUS',
    CURRENT = 'CURRENT',
    NEXT = 'NEXT'
}

export enum MealType {
    BREAKFAST = 'BREAKFAST',
    LUNCH = 'LUNCH',
    DINNER = 'DINNER',
    SNACK = 'SNACK'
}

export interface IMealRecipe {
    recipeId: Types.ObjectId;
    isConsumed: boolean;
    servings: number;
    addedAt: Date;
}

export interface IMealSlot {
    type: MealType;
    recipes: IMealRecipe[];
}

export interface IMealDay {
    date: Date;
    note?: string;
    meals: IMealSlot[];
}

export interface IMealWeek {
    type: WeekType
    startDate: Date;
    days: IMealDay[];
}

export interface IMealPlanStats {
    totalRecipes: number;
    consumedRecipes: number;
    recipesByMealType: {
        [key in MealType]: {
            total: number;
            consumed: number;
        };
    }
}

export interface IMealPlan extends Document {
    userId: Types.ObjectId;
    settings: {
        weekStartDay: number; // 0-6, where 0 is Sunday
        autoGenerateShoppingList: boolean;
        showConsumedMeals: boolean;
    };
    visibility: 'PUBLIC' | 'PRIVATE';
    weeks: IMealWeek[];
    stats: IMealPlanStats;
    lastWeekTransitionNotified: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const mealRecipeSchema = new mongoose.Schema({
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    isConsumed: {
        type: Boolean,
        default: false
    },
    servings: {
        type: Number,
        required: true,
        min: [1, 'Servings must be at least 1'],
        max: [10, 'Servings cannot exceed 10']
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const mealSlotSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(MealType),
        required: true
    },
    recipes: {
        type: [mealRecipeSchema],
        validate: [{
            validator: (recipes: IMealRecipe[]) => recipes.length <= 4,
            message: 'Maximum 4 recipes per meal slot'
        }],
        default: []
    }
}, { _id: false });

const mealDaySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    note: {
        type: String,
        default: ''
    },
    meals: {
        type: [mealSlotSchema],
        validate: [
            {
                validator: function(meals: IMealSlot[]) {
                    // Ensure each meal type appears exactly once
                    const types = meals.map(m => m.type);
                    return types.length === Object.values(MealType).length &&
                    new Set(types).size === types.length;
                },
                message: 'Each meal type must appear exactly once per day'
            }
        ],
        required: true
    }
}, { _id: false });

const weekSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: Object.values(WeekType),
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    days: {
        type: [mealDaySchema],
        validate: [
            {
                validator: (days: IMealDay[]) => days.length === 7,
                message: 'Each week must have exactly 7 days'
            }
        ],
        required: true
    }
}, { _id: false });

const statsSchema = new mongoose.Schema({
    totalRecipes: {
        type: Number,
        default: 0
    },
    consumedRecipes: {
        type: Number,
        default: 0
    },
    recipesByMealType: {
        type: Object,
        default: () => ({
            [MealType.BREAKFAST]: { total: 0, consumed: 0 },
            [MealType.LUNCH]: { total: 0, consumed: 0 },
            [MealType.DINNER]: { total: 0, consumed: 0 },
            [MealType.SNACK]: { total: 0, consumed: 0 }
        })
    }
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    settings: {
        weekStartDay: {
            type: Number,
            min: 0,
            max: 6,
            default: 0 // Sunday
        },
        autoGenerateShoppingList: {
            type: Boolean,
            default: false
        },
        showConsumedMeals: {
            type: Boolean,
            default: true
        }
    },
    visibility: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE'],
        default: 'PRIVATE'
    },
    weeks: {
        type: [weekSchema],
        validate: [
            {
                validator: (weeks: IMealWeek[]) => weeks.length === 3,
                message: 'Must maintain exactly 3 weeks (previous, current, next)'
            }
        ],
        required: true
    },
    stats: {
        type: statsSchema,
        required: true,
        default: () => ({})
    },
    lastWeekTransitionNotified: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    
});

// Indexes
mealPlanSchema.index({ visibility: 1 });
mealPlanSchema.index({ 'weeks.startDate': 1 });


// Pre-save middleware to update stats
mealPlanSchema.pre('save', function(next) {
    if (this.isModified('weeks')) {
        const stats: IMealPlanStats = {
            totalRecipes: 0,
            consumedRecipes: 0,
            recipesByMealType: {
                [MealType.BREAKFAST]: { total: 0, consumed: 0 },
                [MealType.LUNCH]: { total: 0, consumed: 0 },
                [MealType.DINNER]: { total: 0, consumed: 0 },
                [MealType.SNACK]: { total: 0, consumed: 0 }
            }
        };

        // Calculate stats
        this.weeks.forEach(week => {
            week.days.forEach(day => {
                day.meals.forEach(meal => {
                    stats.recipesByMealType[meal.type].total += meal.recipes.length;
                    stats.recipesByMealType[meal.type].consumed += 
                        meal.recipes.filter(r => r.isConsumed).length;
                    
                    stats.totalRecipes += meal.recipes.length;
                    stats.consumedRecipes += meal.recipes.filter(r => r.isConsumed).length;
                });
            });
        });

        this.stats = stats;
    }
    next();
});
  
  export const MealPlan = mongoose.model<IMealPlan>('MealPlan', mealPlanSchema);
  