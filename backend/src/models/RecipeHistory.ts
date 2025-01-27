// src/models/RecipeHistory.ts
import mongoose, { Document, Types } from 'mongoose';

export interface IRecipeHistory extends Document {
    userId: Types.ObjectId;
    entries: Array<{
        recipeId: Types.ObjectId;
        viewedAt: Date;
        viewDuration: number; // Duration in seconds
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const recipeHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    entries: [{
        recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        },
        viewedAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        viewDuration: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    }]
}, {
    timestamps: true
});

// Keep only 10 most recent entries
export const MAX_HISTORY_ENTRIES = 10;
export const MIN_VIEW_DURATION = 5; // Minimum seconds to count as a view

// Middleware to maintain entry limit and sort by viewedAt
recipeHistorySchema.pre('save', function(next) {
    // Create a new array with sorted entries
    const sortedEntries = Array.from(this.entries)
    .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
    
    // Filter entries meeting minimum duration
    const validEntries = sortedEntries
    .filter(entry => entry.viewDuration >= MIN_VIEW_DURATION);
    
    // Limit to maximum entries
    const limitedEntries = validEntries
    .slice(0, MAX_HISTORY_ENTRIES);
    
    // Clear and push new entries to maintain Mongoose array methods
    this.entries.splice(0, this.entries.length);
    limitedEntries.forEach(entry => this.entries.push(entry));
    
    next();
});

export const RecipeHistory = mongoose.model<IRecipeHistory>('RecipeHistory', recipeHistorySchema);
