// src/models/Ingredient.ts
import mongoose, { Document, Model } from 'mongoose';

export interface IIngredient extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  alternateNames: string[];
  image?: string;
  category: string;
  parentIngredient?: mongoose.Types.ObjectId;
  variants?: mongoose.Types.ObjectId[];
  isGeneric: boolean;
  specificType?: string;
  defaultUnit: string;
  validUnits: string[];
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  storage?: string;
  isActive: boolean;
  seasonality?: string[];
}

const ingredientSchema = new mongoose.Schema({
  
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  alternateNames: [{
    type: String,
    trim: true,
    index: true
  }],
  image: {
    type: String,
    validate: {
      validator: (v: string) => !v || /^https?:\/\/.+/.test(v) || v.startsWith('/uploads/'),
      message: 'Image URL must be valid or a valid upload path'
    }
  },
  parentIngredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    validate: {
      validator: async function(this: IIngredient, parentId: mongoose.Types.ObjectId) {
        if (!parentId) return true;
        const parent = await mongoose.model('Ingredient').findById(parentId);
        // Check if the parent exists
        return parent !== null;
      },
      message: 'Parent ingredient must exist in the database'
    }
  },
  variants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient'
  }],
  isGeneric: {
    type: Boolean,
    default: false
  },
  specificType: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['vegetables', 'fruits', 'meat', 'fish', 'dairy', 'grains', 'spices', 'condiments', 'other']
  },
  defaultUnit: {
    type: String,
    required: true
  },
  validUnits: [{
    type: String,
    required: true
  }],
  nutritionPer100g: {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  storage: String,
  isActive: {
    type: Boolean,
    default: true
  },
  seasonality: [String]
}, {
  timestamps: true
});

// Indexes for efficient querying
ingredientSchema.index({ 
  name: 'text', 
  alternateNames: 'text',
  specificType: 'text',
  category: 1,
  parentIngredient: 1
});
ingredientSchema.index({ 
  name: 'text', 
  alternateNames: 'text',
  specificType: 'text'
}, {
  weights: {
    name: 10,
    alternateNames: 5,
    specificType: 3
  },
  name: 'ingredient_search'
});

// Virtual for getting full ingredient path
ingredientSchema.virtual('fullPath').get(async function(this: IIngredient) {
  if (!this.parentIngredient) return this.name;
  const parent = await Ingredient.findById(this.parentIngredient);
  return parent ? `${parent.name} > ${this.name}` : this.name;
});

// Middleware to automatically update variants
ingredientSchema.post('save', async function(doc: IIngredient) {
  if (doc.isGeneric) {
    // Find all ingredients that have this as parent
    const variants = await Ingredient.find({ parentIngredient: doc._id });
    const variantIds = variants.map(v => v._id);
    
    // Update variants if they've changed
    if (!doc.variants || !arraysEqual(doc.variants, variantIds)) {
      await Ingredient.findByIdAndUpdate(doc._id, {
        variants: variantIds
      });
    }
  }
});

// Helper function to compare arrays
function arraysEqual(a: mongoose.Types.ObjectId[], b: mongoose.Types.ObjectId[]) {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val.equals(b[index]));
}

export const Ingredient = mongoose.model<IIngredient>('Ingredient', ingredientSchema);
