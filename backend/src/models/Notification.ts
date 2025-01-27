// src/models/Notification.ts
import mongoose, { Document, Types } from 'mongoose';

export enum NotificationType {
    BADGE_EARNED = 'BADGE_EARNED'
    // Future types:
    // RECIPE_LIKED = 'RECIPE_LIKED',
    // NEW_FOLLOWER = 'NEW_FOLLOWER',
    // etc.
}

export interface INotification extends Document {
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, any>;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);