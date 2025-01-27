// src/types/badge.ts
export interface BadgeCriteria {
    // EFFICIENCY Category
    budget_master: {
        completedBudgetRecipes: number;    // Cook budget-friendly recipes
        avgCostPerServing: number;         // Maximum average cost per serving
        uniqueBudgetRecipes: number;       // Different budget recipes cooked
        totalSaved: number;                // Total money saved vs average
        weeklyStreak: number;              // Weeks maintaining budget
    };

    meal_prep_king: {
        batchSessions: number;             // Batch cooking sessions completed
        mealPlanWeeks: number;             // Weeks with complete meal plans
        prepTimeTotal: number;             // Total prep time accumulated
        recipeReuse: number;               // Reuse recipes in meal plans
        containerVariety: number;          // Different portion sizes used
    };

    // MEAL_TYPE Category
    hangover_master: {
        lateNightCooks: number;           // Cook between 11 PM - 4 AM
        quickRecipes: number;             // Under 30-min recipes completed
        weekendBrunches: number;          // Weekend brunch recipes
        comfortFoodRecipes: number;       // Comfort food tag recipes
        recoveryRecipes: number;          // "Hangover Fix" tag recipes
    };

    snack_champion: {
        uniqueSnacks: number;             // Different snack recipes made
        healthyRatio: number;             // Ratio of healthy snacks
        snackSessions: number;            // Snack cooking sessions
        varietyScore: number;             // Different snack categories
        sharingPortions: number;          // Multi-portion snacks made
    };

    banquet_boss: {
        largeBatchRecipes: number;        // 6+ servings recipes completed
        guestServings: number;            // Total guests served
        complexRecipes: number;           // Difficulty level 3-4 recipes
        eventRecipes: number;             // "Full House" tagged recipes
        varietyInEvent: number;           // Different recipes per event
    };

    brunch_time: {
        brunchRecipes: number;            // Brunch tagged recipes completed
        weekendBrunches: number;          // Weekend brunch sessions
        brunchCategories: number;         // Different brunch categories
        hostingCount: number;             // Multi-serving brunches
        perfectTiming: number;            // Brunches 9 AM - 2 PM
    };

    // COOKING_STYLE Category
    plant_based_lover: {
        veganRecipes: number;             // Vegan recipes completed
        veganStreak: number;              // Days of vegan cooking streak
        uniqueIngredients: number;        // Different plant-based ingredients
        seasonalRecipes: number;          // Seasonal veg recipes used
        veganConversions: number;         // Regular recipes made vegan
    };

    zero_waste_hero: {
        leftoverRecipes: number;          // Leftover recipes completed
        ingredientReuse: number;          // Ingredients reused across recipes
        shoppingListUsage: number;        // Shopping list completion rate
        portionAccuracy: number;          // Accurate portion planning
        wasteReduction: number;           // Reduced waste over time
    };

    // EXPERTISE Category
    sweet_master: {
        dessertRecipes: number;           // Dessert recipes completed
        complexDesserts: number;          // Complex dessert recipes
        uniqueDessertTypes: number;       // Different dessert categories
        successRate: number;              // Successful completions
        customVariations: number;         // Recipe variations created
    };

    spice_master: {
        spicedRecipes: number;            // Spiced recipes completed
        spiceVariety: number;             // Different spices used
        spiceCombinations: number;        // Unique spice combinations
        cuisineVariety: number;           // Different spiced cuisines
        customBlends: number;             // Custom spice blends used
    };
}

export const BADGE_REQUIREMENTS: BadgeCriteria = {
    budget_master: {
        completedBudgetRecipes: 15,      // Complete 15 budget-friendly recipes
        avgCostPerServing: 3.5,          // Average €3.50 or less per serving
        uniqueBudgetRecipes: 8,          // At least 8 different recipes
        totalSaved: 50,                  // Save €50 total vs average
        weeklyStreak: 3                  // Maintain for 3 weeks
    },

    meal_prep_king: {
        batchSessions: 8,                // 8 batch cooking sessions
        mealPlanWeeks: 4,               // 4 complete meal plan weeks
        prepTimeTotal: 480,             // 8 hours total prep time
        recipeReuse: 3,                 // Reuse each recipe 3 times
        containerVariety: 4              // Use 4 different portion sizes
    },

    hangover_master: {
        lateNightCooks: 5,              // 5 late-night cooking sessions
        quickRecipes: 10,               // 10 quick recipes
        weekendBrunches: 4,             // 4 weekend brunches
        comfortFoodRecipes: 6,          // 6 comfort food recipes
        recoveryRecipes: 3              // 3 hangover fix recipes
    },

    snack_champion: {
        uniqueSnacks: 12,               // 12 different snack recipes
        healthyRatio: 0.5,              // 50% healthy snacks
        snackSessions: 20,              // 20 snack cooking sessions
        varietyScore: 5,                // 5 different snack categories
        sharingPortions: 8              // 8 shared snack portions
    },

    banquet_boss: {
        largeBatchRecipes: 8,           // 8 large batch recipes
        guestServings: 30,              // Serve 30 total guests
        complexRecipes: 5,              // 5 complex recipes
        eventRecipes: 6,                // 6 event recipes
        varietyInEvent: 3               // 3 different recipes per event
    },

    brunch_time: {
        brunchRecipes: 10,              // 10 brunch recipes
        weekendBrunches: 6,             // 6 weekend brunches
        brunchCategories: 4,            // 4 brunch categories
        hostingCount: 4,                // 4 hosted brunches
        perfectTiming: 5                // 5 perfectly timed brunches
    },

    plant_based_lover: {
        veganRecipes: 15,               // 15 vegan recipes
        veganStreak: 7,                 // 7-day vegan streak
        uniqueIngredients: 20,          // 20 unique plant ingredients
        seasonalRecipes: 8,             // 8 seasonal recipes
        veganConversions: 5             // 5 converted recipes
    },

    zero_waste_hero: {
        leftoverRecipes: 10,            // 10 leftover recipes
        ingredientReuse: 15,            // 15 ingredient reuses
        shoppingListUsage: 0.9,         // 90% list completion
        portionAccuracy: 0.85,          // 85% portion accuracy
        wasteReduction: 0.7             // 70% waste reduction
    },

    sweet_master: {
        dessertRecipes: 12,             // 12 dessert recipes
        complexDesserts: 5,             // 5 complex desserts
        uniqueDessertTypes: 6,          // 6 dessert types
        successRate: 0.8,               // 80% success rate
        customVariations: 4             // 4 custom variations
    },

    spice_master: {
        spicedRecipes: 15,              // 15 spiced recipes
        spiceVariety: 12,               // 12 different spices
        spiceCombinations: 8,           // 8 spice combinations
        cuisineVariety: 5,              // 5 spiced cuisines
        customBlends: 3                 // 3 custom blends
    }
};


export const CRITERIA_WEIGHTS = {
    // EFFICIENCY Category
    budget_master: {
        completedBudgetRecipes: 0.3,  // Core requirement
        avgCostPerServing: 0.25,      // Important cost metric
        uniqueBudgetRecipes: 0.2,     // Encourage variety
        totalSaved: 0.15,             // Reward savings
        weeklyStreak: 0.1             // Bonus for consistency
    },

    meal_prep_king: {
        batchSessions: 0.3,           // Core batch cooking behavior
        mealPlanWeeks: 0.25,          // Meal planning importance
        prepTimeTotal: 0.2,           // Time investment
        recipeReuse: 0.15,            // Efficient recipe reuse
        containerVariety: 0.1         // Organization bonus
    },

    // MEAL_TYPE Category
    hangover_master: {
        lateNightCooks: 0.25,         // Core timing requirement
        quickRecipes: 0.25,           // Speed importance
        weekendBrunches: 0.2,         // Weekend focus
        comfortFoodRecipes: 0.15,     // Comfort food aspect
        recoveryRecipes: 0.15         // Specific recovery recipes
    },

    snack_champion: {
        uniqueSnacks: 0.3,            // Variety is key
        healthyRatio: 0.25,           // Encourage balance
        snackSessions: 0.2,           // Regular snacking
        varietyScore: 0.15,           // Category diversity
        sharingPortions: 0.1          // Social aspect
    },

    banquet_boss: {
        largeBatchRecipes: 0.3,       // Core large-scale cooking
        guestServings: 0.25,          // Social impact
        complexRecipes: 0.2,          // Skill requirement
        eventRecipes: 0.15,           // Event focus
        varietyInEvent: 0.1           // Menu diversity
    },

    brunch_time: {
        brunchRecipes: 0.3,           // Core brunch expertise
        weekendBrunches: 0.25,        // Timing focus
        brunchCategories: 0.2,        // Category diversity
        hostingCount: 0.15,           // Social aspect
        perfectTiming: 0.1            // Timing bonus
    },

    // COOKING_STYLE Category
    plant_based_lover: {
        veganRecipes: 0.3,            // Core vegan cooking
        veganStreak: 0.25,            // Consistency
        uniqueIngredients: 0.2,       // Ingredient diversity
        seasonalRecipes: 0.15,        // Seasonal awareness
        veganConversions: 0.1         // Creative adaptation
    },

    zero_waste_hero: {
        leftoverRecipes: 0.3,         // Core waste reduction
        ingredientReuse: 0.25,        // Efficiency
        shoppingListUsage: 0.2,       // Planning
        portionAccuracy: 0.15,        // Precision
        wasteReduction: 0.1           // Overall impact
    },

    // EXPERTISE Category
    sweet_master: {
        dessertRecipes: 0.3,          // Core dessert making
        complexDesserts: 0.25,        // Skill level
        uniqueDessertTypes: 0.2,      // Variety
        successRate: 0.15,            // Quality
        customVariations: 0.1         // Creativity
    },

    spice_master: {
        spicedRecipes: 0.3,           // Core spice usage
        spiceVariety: 0.25,           // Spice diversity
        spiceCombinations: 0.2,       // Complexity
        cuisineVariety: 0.15,         // Cultural range
        customBlends: 0.1             // Creativity
    }
};