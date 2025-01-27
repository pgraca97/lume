// src/models/RecipeNote.ts
import mongoose, { Document, Types } from 'mongoose';

// Represents a single version/update of the note
interface INoteHistory {
  content: string;
  updatedAt: Date;
}

// Main note interface
export interface IRecipeNote extends Document {
  userId: Types.ObjectId;
  recipeId: Types.ObjectId;
  content: string;
  history: INoteHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const noteHistorySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const recipeNoteSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    minlength: [1, 'Note cannot be empty'],
    maxlength: [2000, 'Note cannot exceed 2000 characters'],
    validate: {
      validator: function(v: string) {
        return v.trim().length > 0;
      },
      message: 'Note cannot contain only whitespace'
    }
  },
  history: [noteHistorySchema]
}, {
  timestamps: true
});

// Compound index for efficient queries
recipeNoteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

// Pre-save middleware to maintain history
recipeNoteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.history.push({
      content: this.content,
      updatedAt: new Date()
    });
    
    // Keep last 10 versions
    while (this.history.length > 10) {
      this.history.shift(); // Removes oldest entry
    }
  }
  next();
});

export const RecipeNote = mongoose.model<IRecipeNote>('RecipeNote', recipeNoteSchema);