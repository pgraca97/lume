// src/models/enums/RecipeEnums.ts
export enum DifficultyLevel {
    FIRST_APRON = 1,
    KITCHEN_ROOKIE = 2,
    CHEF_MODE = 3,
    CULINARY_PRO = 4
}

export const DIFFICULTY_NAMES = {
    [DifficultyLevel.FIRST_APRON]: "First Apron",
    [DifficultyLevel.KITCHEN_ROOKIE]: "Kitchen Rookie",
    [DifficultyLevel.CHEF_MODE]: "Chef Mode",
    [DifficultyLevel.CULINARY_PRO]: "Culinary Pro"
} as const;

export const DIFFICULTY_DESCRIPTIONS = {
    [DifficultyLevel.FIRST_APRON]: "Simple, straightforward recipes for kitchen beginners. Easier than you think!",
    [DifficultyLevel.KITCHEN_ROOKIE]: "Got the basics? Time to explore new techniques and flavors with slightly more elaborate recipes.",
    [DifficultyLevel.CHEF_MODE]: "Time to level up with recipes that will test your skills!",
    [DifficultyLevel.CULINARY_PRO]: "Advanced recipes that require technique, timing and dedication. For those who feel at home in the kitchen."
} as const;

export enum TagCategory {
    OCCASION = 'OCCASION',
    MOMENT = 'MOMENT',
    LIFESTYLE = 'LIFESTYLE',
    METHOD = 'METHOD',
    CONVENIENCE = 'CONVENIENCE',
    BUDGET = 'BUDGET',
    SEASONAL = 'SEASONAL',
    SPECIAL = 'SPECIAL'
}

// Defining type for tags of each category
export type OccasionTag = 'Study Fuel' | 'Full House' | 'Hangover Fix' | 'Date Night' | 'Movie Night' | 'Game Night' | 'Pre-gaming' | 
'Parents Visit' | 'Office Lunch' | 'Pre-Workout' | 'Post-Workout';

export type MomentTag = 'Breakfast' | 'Brunch' | 'Lunch' | 'Snack' | 'Dinner' | 'Late Night' | 'Quick Bites' | 'Desserts' | 'Drinks & Cocktails';

export type MethodTag = 'One Pot Wonder' | 'Air Fryer Magic' | 'Oven Baked' | 'Stovetop' | 'Microwave' | 'Slow Cooker' | 'No-Cook' | 'Steamed';

export type ConvenienceTag = 'Meal Prep Pro' | 'Batch Cooking' | 'Lunch Box Ready' | 'Freezer Friendly' | 'Zero Waste' | '5 Ingredients or Less';

export type BudgetTag =  'Budget Friendly' | 'End of Month' | 'Worth the Splurge' | 'Leftovers King';

export type SeasonalTag = 'Summer Vibes' | 'Winter Comfort' | 'Spring Fresh' | 'Fall Flavors';

export type SpecialTag = 'Holiday Season' | 'Halloween Treats'| 'BBQ Season'| 'Comfort Food';

export type LifestyleTag = 'Vegan' | 'Vegetarian' | 'Gluten Free' | 'Dairy Free' | 'Keto' | 'Low Carb' |  'High Protein' | 'Pescatarian' | 'Mediterranean';

// Defining the type of the SYSTEM_TAGS object
export const SYSTEM_TAGS: Record<TagCategory, readonly string[]> = {
    [TagCategory.OCCASION]: [
        'Study Fuel',
        'Full House',
        'Hangover Fix',
        'Date Night',
        'Movie Night',
        'Game Night',
        'Pre-gaming',
        'Parents Visit',
        'Office Lunch',
        'Pre-Workout',
        'Post-Workout'
    ],
    [TagCategory.MOMENT]: [
        'Breakfast',
        'Brunch',
        'Lunch',
        'Snack',
        'Dinner',
        'Late Night',
        'Quick Bites',
        'Desserts',
        'Drinks & Cocktails'
    ],
    [TagCategory.METHOD]: [
        'One Pot Wonder',
        'Air Fryer Magic',
        'Oven Baked',
        'Stovetop',
        'Microwave',
        'Slow Cooker',
        'No-Cook',
        'Steamed'
    ],
    [TagCategory.CONVENIENCE]: [
        'Meal Prep Pro',
        'Batch Cooking',
        'Lunch Box Ready',
        'Freezer Friendly',
        'Zero Waste',
        '5 Ingredients or Less'
    ],
    [TagCategory.BUDGET]: [
        'Budget Friendly',
        'End of Month',
        'Worth the Splurge',
        'Leftovers King'
    ],
    [TagCategory.SEASONAL]: [
        'Summer Vibes',
        'Winter Comfort',
        'Spring Fresh',
        'Fall Flavors'
    ],
    [TagCategory.SPECIAL]: [
        'Holiday Season',
        'Halloween Treats',
        'BBQ Season',
        'Comfort Food'
    ],
    [TagCategory.LIFESTYLE]: [
        'Vegan',
        'Vegetarian',
        'Gluten Free',
        'Dairy Free',
        'Keto',
        'Low Carb',
        'High Protein',
        'Pescatarian',
        'Mediterranean'
    ]
} as const;