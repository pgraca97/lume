import { Types } from 'mongoose';
import { IRecipe } from '../models/Recipe';
import { Badge, UserBadgeProgress, BadgeStatus } from '../models/Badge';
import { extractRequiredCount } from '../graphql/resolvers/badge';
import { NotificationService } from '../services/NotificationService';

export async function updateBudgetMasterProgress(
    userId: Types.ObjectId,
    recipe: IRecipe
) {
    const budgetBadge = await Badge.findOne({ key: 'budget-master' });
    if (!budgetBadge) return;

    const progress = await UserBadgeProgress.findOne({
        userId,
        badgeId: budgetBadge._id
    });
    if (!progress) return;

    // Initialize milestones if empty
    if (!progress.milestones?.length) {
        progress.milestones = budgetBadge.requirements.map(req => ({
            description: req,
            requiredCount: extractRequiredCount(req),
            currentCount: 0,
            completed: false
        }));
    }

    // Update completions count for budget recipes
    if (recipe.costPerServing <= 3.50) {
        const milestone = progress.milestones[0];
        if (!milestone) return;

        milestone.currentCount += 1;
        milestone.completed = milestone.currentCount >= milestone.requiredCount;

        // Calculate progress
        const requiredCount = milestone.requiredCount || 15;
        const currentCount = milestone.currentCount || 0;
        
        if (typeof requiredCount === 'number' && typeof currentCount === 'number' && requiredCount > 0) {
            progress.progress = Math.min(
                Math.floor((currentCount / requiredCount) * 100),
                100
            );
        } else {
            progress.progress = 0;
        }
    }


    if (progress.progress === 100 && !progress.achievedAt) {
        progress.status = BadgeStatus.COMPLETED;
        progress.achievedAt = new Date();

        try {
            await NotificationService.createBadgeNotification(
                userId,
                budgetBadge._id
            );
        } catch (error) {
            console.error('Failed to create badge notification:', error);
        }
    }

    try {
        await progress.save();
    } catch (error) {
        console.error('Failed to save progress:', error);
        console.log('Progress state:', {
            currentCount: progress.milestones[0]?.currentCount,
            requiredCount: progress.milestones[0]?.requiredCount,
            calculatedProgress: progress.progress
        });
    }
}