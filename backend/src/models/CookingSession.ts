// src/models/CookingSession.ts
import mongoose, { Document, Types } from 'mongoose';

export enum SessionStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    ABANDONED = 'ABANDONED'
}

export enum CompletionSource {
    COOK_MODE = 'COOK_MODE',
    MEAL_PLAN = 'MEAL_PLAN',
    MANUAL = 'MANUAL'
}

interface IStepProgress {
    stepIndex: number;
    completed: boolean;
}

export interface ICookingSessionModel extends mongoose.Model<ICookingSession> {
    checkAbandoned(timeoutMinutes: number): Promise<mongoose.UpdateWriteOpResult>;
}

export interface ICookingSession extends Document {
    userId: Types.ObjectId;
    recipeId: Types.ObjectId;
    status: SessionStatus;
    currentStepIndex: number;
    totalSteps: number;
    stepsProgress: IStepProgress[];
    servings: number;
    notes?: string;
    startedAt: Date;
    lastActiveAt: Date;
    completedAt?: Date;
    completionSource?: CompletionSource;
    abandonedReason?: string;
}

const stepProgressSchema = new mongoose.Schema({
    stepIndex: {
        type: Number,
        required: true,
        min: 0
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    }
}, { _id: false });

const cookingSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(SessionStatus),
        required: true,
        default: SessionStatus.IN_PROGRESS
    },
    currentStepIndex: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    totalSteps: {
        type: Number,
        required: true,
        min: 1
    },
    stepsProgress: [stepProgressSchema],
    servings: {
        type: Number,
        required: true,
        min: 1,
        max: 50
    },
    notes: {
        type: String,
        maxLength: 1000
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastActiveAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    completedAt: Date,
    completionSource: {
        type: String,
        enum: Object.values(CompletionSource)
    },
    abandonedReason: String
}, {
    timestamps: true,
    indexes: [
        { userId: 1, status: 1 },
        { userId: 1, recipeId: 1 },
        { status: 1, lastActiveAt: 1 }
    ]
});

// Auto-update lastActiveAt
cookingSessionSchema.pre('save', function(next) {
    this.lastActiveAt = new Date();
    next();
});

// Method to check for abandoned sessions
cookingSessionSchema.statics.checkAbandoned = async function(timeoutMinutes: number = 120) {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - timeoutMinutes);

    return this.updateMany(
        {
            status: SessionStatus.IN_PROGRESS,
            lastActiveAt: { $lt: cutoffDate }
        },
        {
            $set: {
                status: SessionStatus.ABANDONED,
                abandonedReason: 'Session timeout'
            }
        }
    );
};

export const CookingSession = mongoose.model<ICookingSession, ICookingSessionModel>(
    'CookingSession', 
    cookingSessionSchema
);