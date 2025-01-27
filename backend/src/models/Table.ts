// src/models/Table.ts
import mongoose, { Document, Types } from 'mongoose';
import { User } from './User';
import { Recipe } from './Recipe';

export enum TablePrivacy {
    PRIVATE = 'PRIVATE',   // Only owner and collaborators
    SHARED = 'SHARED',     // Owner, collaborators, and shared via link
    PUBLIC = 'PUBLIC'      // Visible to all users
}

export enum CollaboratorRole {
    OWNER = 'OWNER',       // Full control + can manage collaborators
    EDITOR = 'EDITOR',     // Can add/remove recipes
    VIEWER = 'VIEWER'      // Can only view recipes
}

export interface ICollaborator {
    userId: Types.ObjectId;
    role: CollaboratorRole;
    addedAt: Date;
    addedBy: Types.ObjectId;
}

export interface ITableRecipe {
    recipeId: Types.ObjectId;
    addedBy: Types.ObjectId;
    addedAt: Date;
}

// Base interface for table data
export interface ITable {
    title: string;
    subtitle?: string;
    emoji?: string;
    privacy: TablePrivacy;
    collaborators: ICollaborator[];
    readonly owner: Types.ObjectId | undefined;  // readonly since it's computed
    recipes: ITableRecipe[]; 
    recentThumbnails: string[];  
    recipeCount: number;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
}

// Document interface that includes Mongoose instance methods
export interface ITableDocument extends ITable, Document {
    isUserCollaborator(userId: Types.ObjectId): boolean;
    canUserEdit(userId: Types.ObjectId): boolean; 
}

const tableSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [50, 'Title cannot exceed 50 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, 'Subtitle cannot exceed 200 characters']
    },
    emoji: {
        type: String,
        validate: {
            validator: (v: string) => !v || v.length <= 2, // Single emoji or empty
            message: 'Invalid emoji format'
        }
    },
    privacy: {
        type: String,
        enum: Object.values(TablePrivacy),
        default: TablePrivacy.PRIVATE
    },
    collaborators: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: Object.values(CollaboratorRole),
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    recipes: [{
        recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    recentThumbnails: {
        type: [String],
        validate: {
            validator: (arr : string[]) => arr.length <= 4,
            message: 'Cannot exceed 4 recent thumbnails'
        }
    },
    recipeCount: {
        type: Number,
        default: 0,
        min: 0,
        max: 500 // Maximum recipes per table
    },
    lastActivityAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
tableSchema.virtual('owner').get(function() {
    return this.collaborators.find(c => c.role === CollaboratorRole.OWNER)?.userId;
});

// Method to check if a user is a collaborator
tableSchema.methods.isUserCollaborator = function(userId: Types.ObjectId) {
    return this.collaborators.some((c: ICollaborator) => c.userId.equals(userId));
};

// Method to check if a user can edit the table
tableSchema.methods.canUserEdit = function(userId: Types.ObjectId) {
    const collaborator = this.collaborators.find((c: ICollaborator) => c.userId.equals(userId));
    return collaborator && [CollaboratorRole.OWNER, CollaboratorRole.EDITOR].includes(collaborator.role);
};

// Indexes for performance
tableSchema.index({ 'collaborators.userId': 1 });
tableSchema.index({ privacy: 1 });
tableSchema.index({ 
    'collaborators.userId': 1, 
    privacy: 1, 
    lastActivityAt: -1 
});

// Middleware to update recipeCount and thumbnails
tableSchema.pre('save', async function(next) {
    if (this.isModified('recipes')) {
      // Update recipe count
      this.recipeCount = this.recipes.length;
      
      // Update recent thumbnails if recipes changed
      if (this.recipes.length > 0) {
        const recentRecipes = await Recipe.find({
          _id: { $in: this.recipes.slice(-4).map(r => r.recipeId) }
        }).select('mainImage');
        
        this.recentThumbnails = recentRecipes
          .map(r => r.mainImage)
          .filter(Boolean)
          .slice(-4);
      } else {
        this.recentThumbnails = [];
      }
    }
    next();
  });

// Validation to ensure owner exists in collaborators
tableSchema.pre('validate', function(next) {
    const hasOwner = this.collaborators.some(c => c.role === CollaboratorRole.OWNER);
    if (!hasOwner) {
        this.invalidate('collaborators', 'Table must have an owner');
    }
    next();
});

export const Table = mongoose.model<ITableDocument>('Table', tableSchema);