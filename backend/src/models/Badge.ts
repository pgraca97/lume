// src/models/Badge.ts
import mongoose, { Document, Types } from 'mongoose';

export enum BadgeCategory {
    COOKING_STYLE = 'COOKING_STYLE',    // E.g., Plant Based, Zero Waste
    MEAL_TYPE = 'MEAL_TYPE',           // E.g., Brunch, Snack, Dessert
    EXPERTISE = 'EXPERTISE',           // E.g., Spice Master
    EFFICIENCY = 'EFFICIENCY',         // E.g., Meal Prep, Budget
    SPECIAL = 'SPECIAL'                // Special achievements
}

export enum BadgeRarity {
    COMMON = 'COMMON',         // Easy to achieve
    UNCOMMON = 'UNCOMMON',     // Requires some dedication
    RARE = 'RARE',            // Significant achievement
    LEGENDARY = 'LEGENDARY'    // Very difficult to achieve
}

export enum BadgeStatus {
    LOCKED = 'LOCKED',           // Not yet visible to user
    HIDDEN = 'HIDDEN',           // Visible but requirements hidden
    VISIBLE = 'VISIBLE',         // Requirements visible
    COMPLETED = 'COMPLETED'      // Badge earned
}

// Type for milestone-based progress
interface IMilestone {
    description: string;
    requiredCount: number;
    currentCount: number;
    completed: boolean;
}

// Base badge definition
export interface IBadge extends Document {
    _id: Types.ObjectId;
    key: string;                   // Unique identifier (e.g., "budget_master")
    name: string;                  // Display name
    description: string;           // Badge description
    category: BadgeCategory;       // Badge category
    rarity: BadgeRarity;          // Badge rarity level
    assetPath: string;            // Path to badge image in Azure
    requirements: string[];        // List of requirements
    xpReward: number;             // XP gained when achieved
    order: number;                // Display order within category
    isActive: boolean;            // Whether badge is currently available
    createdAt: Date;
    updatedAt: Date;
}

// User's progress towards badges
export interface IUserBadgeProgress extends Document {
    userId: Types.ObjectId;
    badgeId: Types.ObjectId;
    status: BadgeStatus;
    progress: number;              // Overall progress (0-100)
    milestones: IMilestone[];     // Detailed milestone tracking if needed
    achievedAt?: Date;            // When badge was earned
    lastUpdated: Date;            // Last progress update
}

const badgeSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: Object.values(BadgeCategory),
        required: true
    },
    rarity: {
        type: String,
        enum: Object.values(BadgeRarity),
        required: true
    },
    assetPath: {
        type: String,
        required: true,
        validate: {
            validator: (v: string) => v.startsWith('badges/'),
            message: 'Asset path must be in badges/ directory'
        }
    },
    requirements: [{
        type: String,
        required: true,
        trim: true
    }],
    xpReward: {
        type: Number,
        required: true,
        min: 0,
        max: 1000
    },
    order: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const userBadgeProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(BadgeStatus),
        required: true,
        default: BadgeStatus.LOCKED
    },
    progress: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    milestones: [{
        description: String,
        requiredCount: Number,
        currentCount: {
            type: Number,
            default: 0
        },
        completed: {
            type: Boolean,
            default: false
        }
    }],
    achievedAt: Date,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient querying
userBadgeProgressSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeProgressSchema.index({ userId: 1, status: 1 });

// Initialize badge progress
userBadgeProgressSchema.statics.initializeForUser = async function(
    userId: Types.ObjectId
) {
    const badges = await Badge.find({ isActive: true });
    const progressDocs = badges.map(badge => ({
        userId,
        badgeId: badge._id,
        status: BadgeStatus.LOCKED,
        progress: 0,
        milestones: []
    }));

    return this.insertMany(progressDocs);
};

export const Badge = mongoose.model<IBadge>('Badge', badgeSchema);
export const UserBadgeProgress = mongoose.model<IUserBadgeProgress>('UserBadgeProgress', userBadgeProgressSchema);

