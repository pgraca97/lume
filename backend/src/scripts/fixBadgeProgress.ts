// src/scripts/fixBadgeProgress.ts
import mongoose from 'mongoose';
import { Badge, UserBadgeProgress } from '../models/Badge';
import dotenv from 'dotenv';

dotenv.config();

function extractRequiredCount(requirement: string): number {
    const match = requirement.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
}

const fixBadgeProgress = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Get all badges
        const badges = await Badge.find({ isActive: true });

        // Get all progress entries with empty milestones
        const emptyProgress = await UserBadgeProgress.find({
            $or: [
                { milestones: { $size: 0 } },
                { milestones: { $exists: false } }
            ]
        });

        console.log(`Found ${emptyProgress.length} progress entries to fix`);

        // Fix each progress entry
        for (const progress of emptyProgress) {
            const badge = badges.find(b => b._id.equals(progress.badgeId));
            if (!badge) continue;

            progress.milestones = badge.requirements.map(req => ({
                description: req,
                requiredCount: extractRequiredCount(req),
                currentCount: 0,
                completed: false
            }));

            await progress.save();
        }

        console.log('Fixed all badge progress entries');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    fixBadgeProgress();
}