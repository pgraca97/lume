// src/scripts/updateUserBadges.ts
import mongoose from 'mongoose';
import { UserBadgeProgress, BadgeStatus } from '../models/Badge';
import dotenv from 'dotenv';

dotenv.config();

const updateUserBadges = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const userId = '67719cd886a495e9cb3f6a99';
        const now = new Date();

        // Completed badges
        const completedBadges = [
            '6792607ea128087479a75109',  // hangover-master
            '6792607ea128087479a7510a',  // snack-champion
            '6792607ea128087479a75108'   // meal-prep-king
        ];

        // Update completed badges
        await UserBadgeProgress.updateMany(
            {
                userId: userId,
                badgeId: { $in: completedBadges }
            },
            {
                $set: {
                    status: BadgeStatus.COMPLETED,
                    progress: 100,
                    achievedAt: now,
                    lastUpdated: now
                }
            }
        );

        // Update budget-master progress (in progress)
        await UserBadgeProgress.updateOne(
            {
                userId: userId,
                badgeId: '6792607ea128087479a75107'  // budget-master
            },
            {
                $set: {
                    status: BadgeStatus.VISIBLE,
                    progress: 80,  // 12/15 meals completed = 80%
                    lastUpdated: now,
                    milestones: [
                        {
                            description: 'Complete 15 budget-friendly recipes',
                            requiredCount: 15,
                            currentCount: 12,
                            completed: false
                        },
                        {
                            description: 'Keep average cost per serving under €3.50',
                            requiredCount: 1,
                            currentCount: 1,
                            completed: true
                        },
                        {
                            description: 'Cook 8 different budget recipes',
                            requiredCount: 8,
                            currentCount: 8,
                            completed: true
                        },
                        {
                            description: 'Save a total of €50',
                            requiredCount: 50,
                            currentCount: 45,
                            completed: false
                        },
                        {
                            description: 'Maintain a 3-week streak',
                            requiredCount: 3,
                            currentCount: 2,
                            completed: false
                        }
                    ]
                }
            }
        );

        console.log('Badge progress updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    updateUserBadges();
}