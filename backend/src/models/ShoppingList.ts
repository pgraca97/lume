// src/models/ShoppingList.ts
import mongoose, { Document, Model, Types } from 'mongoose';

// Type for category statistics
interface CategoryStats {
    total: number;
    completed: number;
}

// Type for item statistics
interface ItemStats {
    totalItems: number;
    completedItems: number;
    itemsByCategory: Record<ItemCategory, CategoryStats>;
}

export enum ListStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED'
}

export enum ItemCategory {
    FRESH = 'FRESH',         // Frescos
    GROCERY = 'GROCERY',     // Mercearia
    FROZEN = 'FROZEN',       // Congelados
    BEVERAGES = 'BEVERAGES', // Bebidas
    OTHER = 'OTHER'          // Outros
}

export enum ItemUnit {
    GRAM = 'g',
    KILOGRAM = 'kg',
    MILLILITER = 'ml',
    LITER = 'l',
    UNIT = 'uni'
}

export enum ListType {
    REGULAR = 'REGULAR',
    MEAL_PLAN = 'MEAL_PLAN'
}

// Constants for limits
export const SHOPPING_LIST_LIMITS = {
    MAX_ACTIVE_LISTS: 5,
    MAX_ITEMS_PER_LIST: 50,
    MAX_COMPLETED_LISTS: 5,
    MAX_NOTE_LENGTH: 100
} as const;

export interface IShoppingListItem {
    _id: Types.ObjectId;         // MongoDB document ID
    ingredient?: Types.ObjectId;  // Reference to Ingredient model
    customName?: string;         // For non-referenced ingredients
    category: ItemCategory;
    quantity: number | null;  // Allow null for now bc of the MEAL_PLAN shopping list
    unit: ItemUnit | null;    // Allow null for now bc of the MEAL_PLAN shopping list
    isCompleted: boolean;
    note?: string;              // Optional notes about the item
    addedBy: Types.ObjectId;    // User who added the item
    addedAt: Date;
    completedAt?: Date;         // When the item was marked as completed
metadata?: {
    fromRecipes?: Types.ObjectId[];  // Track which recipes this item came from
}
}


export const INGREDIENT_TO_SHOPPING_CATEGORY: Record<string, ItemCategory> = {
    // Fresh ingredients
    'meat': ItemCategory.FRESH,
    'fish': ItemCategory.FRESH,
    'vegetables': ItemCategory.FRESH,
    'fruits': ItemCategory.FRESH,
    'dairy': ItemCategory.FRESH,
    
    // Grocery items
    'grains': ItemCategory.GROCERY,
    'spices': ItemCategory.GROCERY,
    'condiments': ItemCategory.GROCERY,
    
    // Frozen items
    'frozen': ItemCategory.FROZEN,
    
    // Beverages
    'beverages': ItemCategory.BEVERAGES,
    
    // Default category
    'other': ItemCategory.OTHER
};


export interface IShoppingList extends Document {
    userId: Types.ObjectId;        // Owner of the list
    title: string;
    status: ListStatus;
    isPinned: boolean;            // Only one list can be pinned
    hideCompleted: boolean;       // Toggle for "Mostrar items comprados"
    listType: ListType;
    mealPlanWeekId?: Types.ObjectId; // Reference to MealPlanWeek
    items: IShoppingListItem[];
    itemStats: {                  // Denormalized statistics
        totalItems: number;
        completedItems: number;
        itemsByCategory: {
            [key in ItemCategory]: {
                total: number;
                completed: number;
            };
        };
    };
    lastModifiedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const shoppingListItemSchema = new mongoose.Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: false
    },
    customName: {
        type: String,
        required: false,
        trim: true,
        minLength: [2, 'Item name must be at least 2 characters long'],
        maxLength: [100, 'Item name cannot exceed 100 characters']
    },
    category: {
        type: String,
        enum: Object.values(ItemCategory),
        required: true
    },
    quantity: {
        type: Number,
        default: null
    },
    unit: {
        type: String,
        enum: [...Object.values(ItemUnit), null],
        default: null
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    note: {
        type: String,
        trim: true,
        maxLength: [SHOPPING_LIST_LIMITS.MAX_NOTE_LENGTH, `Note cannot exceed ${SHOPPING_LIST_LIMITS.MAX_NOTE_LENGTH} characters`]
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, { _id: true });

// Validation to ensure either ingredient or customName is provided
shoppingListItemSchema.pre('validate', function(next) {
    if (!this.ingredient && !this.customName) {
        this.invalidate('ingredient', 'Either ingredient reference or customName must be provided');
    }
    next();
});



export interface IShoppingListDocument extends IShoppingList, Document {
    checkCompletion: () => boolean;
}

export interface IShoppingListModel extends Model<IShoppingListDocument> {
    manageCompletedLists: (userId: Types.ObjectId) => Promise<void>;
}

const shoppingListSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minLength: [3, 'Title must be at least 3 characters long'],
        maxLength: [50, 'Title cannot exceed 50 characters']
    },
    status: {
        type: String,
        enum: Object.values(ListStatus),
        default: ListStatus.ACTIVE,
        required: true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    hideCompleted: {
        type: Boolean,
        default: false
    },
    listType: {
        type: String,
        enum: Object.values(ListType),
        required: true
    },
    mealPlanWeekId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPlan',
        required: false
    },
    items: [shoppingListItemSchema],
    itemStats: {
        totalItems: {
            type: Number,
            default: 0
        },
        completedItems: {
            type: Number,
            default: 0
        },
        itemsByCategory: {
            type: Object,
            default: () => {
                const stats: Record<ItemCategory, CategoryStats> = {} as Record<ItemCategory, CategoryStats>;
                Object.values(ItemCategory).forEach(category => {
                    stats[category] = { total: 0, completed: 0 };
                });
                return stats;
            }
        }
    },
    lastModifiedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
shoppingListSchema.index({ userId: 1, status: 1, lastModifiedAt: -1 });
shoppingListSchema.index({ userId: 1, isPinned: 1 });
shoppingListSchema.index({ 
    userId: 1, 
    'items.ingredient': 1,
    'items.category': 1
});

// Helper method to check if list should be marked as completed
shoppingListSchema.methods.checkCompletion = function(this: IShoppingList): boolean {
    if (this.items.length > 0 && this.items.every((item: IShoppingListItem) => item.isCompleted)) {
        this.status = ListStatus.COMPLETED;
        this.isPinned = false; // Unpin completed lists
        return true;
    }
    return false;
};

// Helper method to manage completed lists limit
shoppingListSchema.statics.manageCompletedLists = async function(userId: Types.ObjectId) {
    const completedLists = await this.find({
        userId,
        status: ListStatus.COMPLETED
    }).sort({ lastModifiedAt: -1 });

    if (completedLists.length > SHOPPING_LIST_LIMITS.MAX_COMPLETED_LISTS) {
        const listsToArchive = completedLists.slice(SHOPPING_LIST_LIMITS.MAX_COMPLETED_LISTS);
        for (const list of listsToArchive) {
            list.status = ListStatus.ARCHIVED;
            await list.save();
        }
    }
};

// Middleware to enforce list limits
shoppingListSchema.pre('save', async function(next) {
    if (this.isNew && this.status === ListStatus.ACTIVE) {
        const activeListsCount = await ShoppingList.countDocuments({
            userId: this.userId,
            status: ListStatus.ACTIVE
        });
        
        if (activeListsCount >= SHOPPING_LIST_LIMITS.MAX_ACTIVE_LISTS) {
            throw new Error(`Maximum limit of ${SHOPPING_LIST_LIMITS.MAX_ACTIVE_LISTS} active lists reached`);
        }
    }

    if (this.items.length > SHOPPING_LIST_LIMITS.MAX_ITEMS_PER_LIST) {
        throw new Error(`Maximum limit of ${SHOPPING_LIST_LIMITS.MAX_ITEMS_PER_LIST} items per list reached`);
    }

    next();
});

// Middleware to update statistics before saving
shoppingListSchema.pre('save', function(next) {
    // Reset stats
    const stats: ItemStats = {
        totalItems: this.items.length,
        completedItems: 0,
        itemsByCategory: {} as Record<ItemCategory, CategoryStats>
    };

    // Initialize category counts
    Object.values(ItemCategory).forEach(category => {
        stats.itemsByCategory[category] = { total: 0, completed: 0 };
    });

    // Calculate new stats
    this.items.forEach(item => {
        const category = item.category as ItemCategory;
        if (stats.itemsByCategory[category]) {
            stats.itemsByCategory[category].total++;
            
            if (item.isCompleted) {
                stats.completedItems++;
                stats.itemsByCategory[category].completed++;
            }
        }
    });

    // Update stats and lastModifiedAt
    this.itemStats = stats;
    this.lastModifiedAt = new Date();
    
    next();
});

// Ensure only one pinned list per user
shoppingListSchema.pre('save', async function(next) {
    if (this.isPinned && this.isModified('isPinned')) {
        await ShoppingList.updateMany(
            { 
                userId: this.userId, 
                _id: { $ne: this._id },
                isPinned: true 
            },
            { $set: { isPinned: false } }
        );
    }
    next();
});

// We should prevent duplicate names per user, maybe?
shoppingListSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('title')) {
        const existingList = await ShoppingList.findOne({
            userId: this.userId,
            title: this.title,
            _id: { $ne: this._id }
        });
        
        if (existingList) {
            throw new Error('You already have a list with this name');
        }
    }
    next();
});



shoppingListSchema.pre<IShoppingListDocument>('save', function(next) {
    // Validate items based on list type
    const isValid = this.items.every(item => {
        if (this.listType === ListType.MEAL_PLAN) {
            // For meal plan lists, quantity and unit should be null
            return item.quantity === null && item.unit === null;
        } else {
            // For regular lists, validate quantity and unit
            return (
                item.quantity !== null &&
                item.unit !== null &&
                item.quantity >= 0.1 &&
                item.quantity <= 1000 &&
                Object.values(ItemUnit).includes(item.unit)
            );
        }
    });

    if (!isValid) {
        throw new Error(
            this.listType === ListType.MEAL_PLAN
                ? 'Meal plan shopping lists must have null quantity and unit'
                : 'Regular shopping lists must have valid quantity and unit'
        );
    }

    next();
});

export const ShoppingList = mongoose.model<IShoppingListDocument, IShoppingListModel>('ShoppingList', shoppingListSchema);