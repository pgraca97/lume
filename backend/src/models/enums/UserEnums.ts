// src/models/enums/UserEnums.ts

export enum MeasurementSystem {
    METRIC = 'METRIC',
    IMPERIAL = 'IMPERIAL',
    HYBRID = 'HYBRID'  // For users comfortable with both
}

export enum PortionSize {
    SMALL = 'SMALL',       // For single portions or light eaters
    MEDIUM = 'MEDIUM',     // Standard portions
    LARGE = 'LARGE'        // For meal prep or family style
}

export enum CookingGoal {
    LEARN_BASICS = 'LEARN_BASICS',
    MEAL_PREP = 'MEAL_PREP',
    EAT_HEALTHY = 'EAT_HEALTHY',
    SAVE_MONEY = 'SAVE_MONEY',
    SAVE_TIME = 'SAVE_TIME',
    IMPROVE_SKILLS = 'IMPROVE_SKILLS',
    EXPLORE_CUISINES = 'EXPLORE_CUISINES'
}

export enum TimePreference {
    QUICK_MEALS = 'QUICK_MEALS',        // Under 30 minutes
    MODERATE_TIME = 'MODERATE_TIME',    // 30-60 minutes
    FLEXIBLE = 'FLEXIBLE'               // No time constraints
}

export enum BudgetLevel {
    BUDGET_FRIENDLY = 'BUDGET_FRIENDLY',    // Focus on cost-effective recipes
    MODERATE = 'MODERATE',                  // Balance between cost and variety
    PREMIUM = 'PREMIUM'                     // Open to premium ingredients
}

export enum MealPlanningFrequency {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    FLEXIBLE = 'FLEXIBLE',
    NONE = 'NONE'
}

// Dietary preferences 
export enum DietaryProfile {
    OMNIVORE = 'OMNIVORE',
    VEGETARIAN = 'VEGETARIAN',
    VEGAN = 'VEGAN',
    PESCATARIAN = 'PESCATARIAN',
    FLEXITARIAN = 'FLEXITARIAN'
}

// Common dietary restrictions and preferences
export const DIETARY_RESTRICTIONS = [
    'GLUTEN_FREE',
    'DAIRY_FREE',
    'NUT_FREE',
    'SOY_FREE',
    'EGG_FREE',
    'SHELLFISH_FREE',
    'LOW_CARB',
    'LOW_FAT',
    'LOW_SODIUM',
    'HIGH_PROTEIN',
    'HALAL',
    'KOSHER'
] as const;

export const COMMON_ALLERGENS = [
    'PEANUTS',
    'TREE_NUTS',
    'MILK',
    'EGGS',
    'SOY',
    'WHEAT',
    'FISH',
    'SHELLFISH',
    'SESAME'
] as const;

export enum OnboardingStep {
    PROFILE = 'PROFILE',
    EXPERIENCE = 'EXPERIENCE',
    DIETARY = 'DIETARY',
    PREFERENCES = 'PREFERENCES',
}