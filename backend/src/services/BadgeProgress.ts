// src/services/BadgeProgress.ts
import { Types } from 'mongoose';
import { Recipe } from '../models/Recipe';
import { CookingSession } from '../models/CookingSession';
import { MealPlan } from '../models/MealPlan';
import { BADGE_REQUIREMENTS, CRITERIA_WEIGHTS } from '../types/badge';

export class BadgeProgressCalculator {
    /**
     * Calculate Budget Master progress
     */
    static async calculateBudgetMasterProgress(userId: Types.ObjectId): Promise<number> {
        const criteria = BADGE_REQUIREMENTS.budget_master;
        const weights = CRITERIA_WEIGHTS.budget_master;

        // Get all completed budget-friendly cooking sessions
        const sessions = await CookingSession.find({
            userId,
            status: 'COMPLETED'
        }).populate({
            path: 'recipeId',
            match: { 
                'tags.name': 'Budget Friendly',
                isActive: true 
            }
        });

        const validSessions = sessions.filter(s => s.recipeId);

        // Calculate metrics
        const completedCount = validSessions.length;
        const avgCost = validSessions.reduce((sum, s) => 
            sum + (s.recipeId as any).costPerServing, 0) / completedCount;
        
        const uniqueRecipes = new Set(
            validSessions.map(s => s.recipeId._id.toString())
        ).size;

        // Calculate savings
        const avgRecipeCost = 5.50; // Base average cost per serving
        const totalSaved = validSessions.reduce((sum, s) => 
            sum + (avgRecipeCost - (s.recipeId as any).costPerServing) * s.servings, 0);

        // Calculate weekly streak
        const weeklyStreak = await this.calculateWeeklyStreak(
            userId,
            validSessions,
            criteria.avgCostPerServing
        );

        // Calculate weighted progress
        const progress = (
            (completedCount / criteria.completedBudgetRecipes) * weights.completedBudgetRecipes +
            (avgCost <= criteria.avgCostPerServing ? 1 : 0) * weights.avgCostPerServing +
            (uniqueRecipes / criteria.uniqueBudgetRecipes) * weights.uniqueBudgetRecipes +
            (totalSaved / criteria.totalSaved) * weights.totalSaved +
            (weeklyStreak / criteria.weeklyStreak) * weights.weeklyStreak
        ) * 100;

        return Math.min(Math.round(progress), 100);
    }

    /**
     * Calculate Meal Prep King progress
     */
    static async calculateMealPrepProgress(userId: Types.ObjectId): Promise<number> {
        const criteria = BADGE_REQUIREMENTS.meal_prep_king;
        
        // Get batch cooking sessions (recipes with 4+ servings)
        const batchSessions = await CookingSession.find({
            userId,
            status: 'COMPLETED',
            servings: { $gte: 4 }
        });

        // Get completed meal plan weeks
        const mealPlans = await MealPlan.find({ userId });
        const completedWeeks = mealPlans.reduce((count, plan) => {
            const completedDays = plan.weeks.reduce((sum, week) => 
                sum + week.days.filter(day => 
                    day.meals.every(meal => 
                        meal.recipes.every(recipe => recipe.isConsumed)
                    )
                ).length, 0);
            return count + Math.floor(completedDays / 7);
        }, 0);

        // Calculate total prep time
        const totalPrepTime = batchSessions.reduce((sum, session) => {
            const recipe = session.recipeId as any;
            return sum + (recipe ? recipe.prepTime : 0);
        }, 0);

        // Calculate recipe reuse
        const recipeReuse = await this.calculateRecipeReuse(userId);

        // Calculate container variety
        const containerVariety = await this.calculateContainerVariety(userId);

        // Calculate progress (equal weights for simplicity)
        const progress = (
            Math.min(batchSessions.length / criteria.batchSessions, 1) * 0.25 +
            Math.min(completedWeeks / criteria.mealPlanWeeks, 1) * 0.25 +
            Math.min(totalPrepTime / criteria.prepTimeTotal, 1) * 0.2 +
            Math.min(recipeReuse / criteria.recipeReuse, 1) * 0.15 +
            Math.min(containerVariety / criteria.containerVariety, 1) * 0.15
        ) * 100;

        return Math.round(progress);
    }

    /**
     * Calculate Hangover Master progress
     */
    static async calculateHangoverMasterProgress(userId: Types.ObjectId): Promise<number> {
        const criteria = BADGE_REQUIREMENTS.hangover_master;

        // Get late night cooking sessions (11 PM - 4 AM)
        const lateNightSessions = await CookingSession.find({
            userId,
            status: 'COMPLETED',
            startedAt: {
                $or: [
                    { $gte: new Date().setHours(23, 0, 0) },
                    { $lte: new Date().setHours(4, 0, 0) }
                ]
            }
        });

        // Get quick recipes (under 30 mins)
        const quickSessions = await CookingSession.find({
            userId,
            status: 'COMPLETED'
        }).populate({
            path: 'recipeId',
            match: { 
                totalTime: { $lte: 30 },
                isActive: true
            }
        });

        // Get weekend brunch sessions
        const weekendBrunches = await this.getWeekendBrunchSessions(userId);

        // Get comfort food recipes
        const comfortFoodSessions = await CookingSession.find({
            userId,
            status: 'COMPLETED'
        }).populate({
            path: 'recipeId',
            match: {
                'tags.name': 'Comfort Food',
                isActive: true
            }
        });

        // Get hangover fix recipes
        const hangoverFixSessions = await CookingSession.find({
            userId,
            status: 'COMPLETED'
        }).populate({
            path: 'recipeId',
            match: {
                'tags.name': 'Hangover Fix',
                isActive: true
            }
        });

        // Calculate weighted progress
        const progress = (
            Math.min(lateNightSessions.length / criteria.lateNightCooks, 1) * 0.2 +
            Math.min(quickSessions.length / criteria.quickRecipes, 1) * 0.2 +
            Math.min(weekendBrunches.length / criteria.weekendBrunches, 1) * 0.2 +
            Math.min(comfortFoodSessions.length / criteria.comfortFoodRecipes, 1) * 0.2 +
            Math.min(hangoverFixSessions.length / criteria.recoveryRecipes, 1) * 0.2
        ) * 100;

        return Math.round(progress);
    }

    // Helper methods
    private static async calculateWeeklyStreak(
        userId: Types.ObjectId,
        sessions: any[],
        maxCostPerServing: number
    ): Promise<number> {
        // Group sessions by week
        const weeklyGroups = sessions.reduce((groups: any, session) => {
            const weekStart = this.getWeekStart(session.startedAt);
            if (!groups[weekStart]) {
                groups[weekStart] = [];
            }
            groups[weekStart].push(session);
            return groups;
        }, {});

        // Count consecutive weeks meeting criteria
        let streak = 0;
        let currentStreak = 0;
        Object.values(weeklyGroups).forEach((weekSessions: any) => {
            const weekAvgCost = weekSessions.reduce((sum: number, s: any) => 
                sum + s.recipeId.costPerServing, 0) / weekSessions.length;
            
            if (weekAvgCost <= maxCostPerServing) {
                currentStreak++;
                streak = Math.max(streak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        return streak;
    }

    private static async calculateRecipeReuse(userId: Types.ObjectId): Promise<number> {
        const sessions = await CookingSession.find({ userId, status: 'COMPLETED' });
        const recipeUsage = sessions.reduce((count: any, session) => {
            const recipeId = session.recipeId.toString();
            count[recipeId] = (count[recipeId] || 0) + 1;
            return count;
        }, {});

        return Object.values(recipeUsage).filter((count: any) => count >= 3).length;
    }

    private static async calculateContainerVariety(userId: Types.ObjectId): Promise<number> {
        const sessions = await CookingSession.find({ userId, status: 'COMPLETED' });
        const servingSizes = new Set(sessions.map(s => s.servings));
        return servingSizes.size;
    }

    private static async getWeekendBrunchSessions(userId: Types.ObjectId): Promise<any[]> {
        const sessions = await CookingSession.find({
            userId,
            status: 'COMPLETED'
        }).populate({
            path: 'recipeId',
            match: { 
                'tags.name': 'Brunch',
                isActive: true
            }
        });

        return sessions.filter(session => {
            const day = session.startedAt.getDay();
            const hour = session.startedAt.getHours();
            // Weekend (Saturday or Sunday) and between 9 AM and 2 PM
            return (day === 0 || day === 6) && hour >= 9 && hour <= 14;
        });
    }

    private static getWeekStart(date: Date): string {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay()); // Set to Sunday
        return d.toISOString();
    }
}