// src/graphql/resolvers/shoppingList.ts
import { Types, Error as MongooseError } from 'mongoose';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';
import { 
    ShoppingList, 
    ListStatus, 
    ItemCategory,
    ItemUnit,
    SHOPPING_LIST_LIMITS,
    IShoppingList,
    IShoppingListItem,
    IShoppingListDocument
} from '../../models/ShoppingList';
import { User } from '../../models/User';
import { Ingredient } from '../../models/Ingredient';
import { GraphQLError } from 'graphql';

// Category order for sorting
const CATEGORY_ORDER: Record<ItemCategory, number> = {
    [ItemCategory.FRESH]: 1,
    [ItemCategory.GROCERY]: 2,
    [ItemCategory.FROZEN]: 3,
    [ItemCategory.BEVERAGES]: 4,
    [ItemCategory.OTHER]: 5
};

// Helper for getting the current user or throwing an error
const getAuthenticatedUser = async (context: Context) => {
    const user = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: user.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    return dbUser;
};

// Helper for finding and validating a shopping list
const getShoppingList = async (listId: string, userId: Types.ObjectId): Promise<IShoppingListDocument> => {
    const list = await ShoppingList.findById(listId);
    if (!list) {
        throw new ApplicationError('Shopping list not found', 404);
    }
    if (!list.userId.equals(userId)) {
        throw new ApplicationError('Not authorized to access this list', 403);
    }
    return list;
};

export const shoppingListResolvers = {
    Query: {
        shoppingLists: async (_: never, 
            { status }: { status: ListStatus[] }, 
            context: Context
        ): Promise<IShoppingListDocument[]> => {
            const dbUser = await getAuthenticatedUser(context);
            
            return ShoppingList.find({
                userId: dbUser._id,
                status: { $in: status }
            }).sort({ 
                isPinned: -1,
                lastModifiedAt: -1
            });
        },

        shoppingList: async (_: never, 
            { id }: { id: string }, 
            context: Context
        ): Promise<IShoppingListDocument> => {
            const dbUser = await getAuthenticatedUser(context);
            return getShoppingList(id, dbUser._id);
        },

        pinnedShoppingList: async (_: never,
            __: never,
            context: Context
        ): Promise<IShoppingListDocument | null> => {
            const dbUser = await getAuthenticatedUser(context);
            return ShoppingList.findOne({
                userId: dbUser._id,
                isPinned: true,
                status: ListStatus.ACTIVE
            });
        },

        shoppingListLimits: async (_: never, __: never, context: Context) => {
            const dbUser = await getAuthenticatedUser(context);
        
            const [activeLists, completedLists] = await Promise.all([
                ShoppingList.countDocuments({
                    userId: dbUser._id,
                    status: ListStatus.ACTIVE
                }),
                ShoppingList.countDocuments({
                    userId: dbUser._id,
                    status: ListStatus.COMPLETED
                })
            ]);
        
        
            return {
                maxActiveLists: SHOPPING_LIST_LIMITS.MAX_ACTIVE_LISTS,
                maxItemsPerList: SHOPPING_LIST_LIMITS.MAX_ITEMS_PER_LIST,
                maxCompletedLists: SHOPPING_LIST_LIMITS.MAX_COMPLETED_LISTS,
                maxNoteLength: SHOPPING_LIST_LIMITS.MAX_NOTE_LENGTH,
                currentActiveLists: activeLists || 0,
                currentCompletedLists: completedLists || 0
            };
        },
    },

    Mutation: {
        createShoppingList: async (_: never,
            { input }: { input: { title: string; isPinned?: boolean } },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);

            try {
                const list = await ShoppingList.create({
                    ...input,
                    userId: dbUser._id,
                    status: ListStatus.ACTIVE
                });

                return {
                    success: true,
                    message: 'Shopping list created successfully',
                    list
                };
            } catch (error) {
                if (error instanceof MongooseError && error.message.includes('Maximum limit')) {
                    throw new ApplicationError(error.message, 400);
                }
                throw error;
            }
        },

        addShoppingListItem: async (_: never,
            { input }: { 
                input: {
                    listId: string;
                    ingredientId?: string;
                    customName?: string;
                    category: ItemCategory;
                    quantity: number;
                    unit: ItemUnit;
                    note?: string;
                }
            },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(input.listId, dbUser._id);

            if (list.status !== ListStatus.ACTIVE) {
                throw new ApplicationError('Can only add items to active lists', 400);
            }

            if (list.items.length >= SHOPPING_LIST_LIMITS.MAX_ITEMS_PER_LIST) {
                throw new ApplicationError(
                    `Maximum limit of ${SHOPPING_LIST_LIMITS.MAX_ITEMS_PER_LIST} items reached`,
                    400
                );
            }


const isDuplicate = list.items.some(item => 
    (item.ingredient && input.ingredientId && item.ingredient.equals(input.ingredientId)) ||
    (item.customName && input.customName && item.customName.toLowerCase() === input.customName.toLowerCase())
);

if (isDuplicate) {
    throw new ApplicationError('Duplicate item detected. Please update the existing item or remove it before adding a new one.', 400);
}

            const newItem: Partial<IShoppingListItem> = {
                ...(input.ingredientId && { ingredient: new Types.ObjectId(input.ingredientId) }),
                ...(input.customName && { customName: input.customName }),
                category: input.category,
                quantity: input.quantity,
                unit: input.unit,
                note: input.note,
                isCompleted: false,
                addedBy: dbUser._id,
                addedAt: new Date()
            };

            list.items.push(newItem as IShoppingListItem);
            await list.save();

            return {
                success: true,
                message: 'Item added successfully',
                list
            };
        },

        updateShoppingListItem: async (_: never,
            { input }: {
                input: {
                    listId: string;
                    itemId: string;
                    quantity?: number;
                    unit?: ItemUnit;
                    note?: string;
                    category?: ItemCategory;
                }
            },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(input.listId, dbUser._id);


            const itemIndex = list.items.findIndex(
                item => item._id && item._id.toString() === input.itemId
            );
            

            if (itemIndex === -1) {
                throw new ApplicationError('Item not found', 404);
            }

            // Update only provided fields
            const updateFields: Partial<IShoppingListItem> = {};
            if (input.quantity !== undefined) updateFields.quantity = input.quantity;
            if (input.unit !== undefined) updateFields.unit = input.unit;
            if (input.note !== undefined) updateFields.note = input.note;
            if (input.category !== undefined) updateFields.category = input.category;

            Object.assign(list.items[itemIndex], updateFields);
            await list.save();

            return {
                success: true,
                message: 'Item updated successfully',
                list
            };
        },

        toggleShoppingListItem: async (_: never,
            { input: { listId, itemId } }: { 
                input: { listId: string; itemId: string }
            },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(listId, dbUser._id);

            const item = list.items.find(
                item => item._id && item._id.toString() === itemId
            );

            if (!item) {
                throw new ApplicationError('Item not found', 404);
            }

            item.isCompleted = !item.isCompleted;
            item.completedAt = item.isCompleted ? new Date() : undefined;

            if (list.checkCompletion()) {
                await ShoppingList.manageCompletedLists(dbUser._id);
            }

            await list.save();

            return {
                success: true,
                message: `Item marked as ${item.isCompleted ? 'completed' : 'incomplete'}`,
                list
            };
        },

        updateShoppingList: async (_: never,
            { id, input }: { 
                id: string; 
                input: { 
                    title?: string; 
                    isPinned?: boolean;
                    hideCompleted?: boolean;
                    status?: ListStatus;
                }
            },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(id, dbUser._id);
        
            if (input.status) {
                // Validate status transitions
                if (input.status === ListStatus.COMPLETED && 
                    !list.items.every(item => item.isCompleted)) {
                    throw new ApplicationError('Cannot mark list as completed with incomplete items', 400);
                }
        
                if (input.status === ListStatus.ARCHIVED && 
                    list.status !== ListStatus.COMPLETED) {
                    throw new ApplicationError('Only completed lists can be archived', 400);
                }
        
                // Auto-unpin completed/archived lists
                if (input.status !== ListStatus.ACTIVE) {
                    input.isPinned = false;
                }
            }
        
            Object.assign(list, input);
            await list.save();
        
            return {
                success: true,
                message: 'Shopping list updated successfully',
                list
            };
        },

        deleteShoppingList: async (
            _: never,
            { id, input }: { 
                id: string;
                input?: { force?: boolean };
            },
            context: Context
        ) => {
            try {
                const dbUser = await getAuthenticatedUser(context);
                const list = await getShoppingList(id, dbUser._id);
        
                // Check if input is provided and if forceDelete is true
                if (list.status === ListStatus.ACTIVE && 
                    list.items.some(item => !item.isCompleted)) {
                    if (!input?.force) {
                        throw new ApplicationError(
                            'List has incomplete items. Please confirm deletion by setting forceDelete to true', 
                            400,
                            {
                                itemCount: list.items.filter(i => !i.isCompleted).length,
                                requiresConfirmation: true
                            });
                    }
                }
        
                await list.deleteOne();
        
                return {
                    success: true,
                    message: 'Shopping list deleted successfully'
                };
            } catch (error) {
                if (error instanceof ApplicationError) {
                    throw new GraphQLError(error.message, {
                        extensions: {
                            code: error.details?.code,
                            ...error.details
                        }
                    });
                }
                throw error;
            }
        },

        removeShoppingListItem: async (_: never,
            { listId, itemId }: { listId: string; itemId: string },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(listId, dbUser._id);
    
            const itemIndex = list.items.findIndex(
                item => item._id && item._id.toString() === itemId
            );
    
            if (itemIndex === -1) {
                throw new ApplicationError('Item not found', 404);
            }
    
            list.items.splice(itemIndex, 1);
            await list.save();
    
            return {
                success: true,
                message: 'Item removed successfully',
                list
            };
        },
    
        toggleAllShoppingListItems: async (_: never,
            { listId, completed }: { listId: string; completed: boolean },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(listId, dbUser._id);
    
            const now = new Date();
            list.items.forEach(item => {
                item.isCompleted = completed;
                item.completedAt = completed ? now : undefined;
            });
    
            if (completed && list.checkCompletion()) {
                await ShoppingList.manageCompletedLists(dbUser._id);
            }
    
            await list.save();
    
            return {
                success: true,
                message: `All items marked as ${completed ? 'completed' : 'incomplete'}`,
                list
            };
        },
    
        clearCompletedItems: async (_: never, { listId }: { listId: string }, context: Context) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(listId, dbUser._id);
        
            if (list.status === ListStatus.ARCHIVED) {
                throw new ApplicationError('Cannot modify archived lists', 400);
            }
        
            const completedItems = list.items.filter(item => item.isCompleted);
            if (completedItems.length === 0) {
                throw new ApplicationError('No completed items to clear', 400);
            }
        
            list.items = list.items.filter(item => !item.isCompleted);
            if (list.status === ListStatus.COMPLETED) {
                list.status = ListStatus.ACTIVE;
            }
        
            await list.save();
        
            return {
                success: true,
                message: `Cleared ${completedItems.length} completed items`,
                list
            };
        },
    
        archiveShoppingList: async (_: never,
            { id }: { id: string },
            context: Context
        ) => {
            const dbUser = await getAuthenticatedUser(context);
            const list = await getShoppingList(id, dbUser._id);
    
            if (list.status !== ListStatus.COMPLETED) {
                throw new ApplicationError(
                    'Only completed lists can be archived',
                    400
                );
            }
    
            list.status = ListStatus.ARCHIVED;
            list.isPinned = false;
            await list.save();
    
            return {
                success: true,
                message: 'Shopping list archived',
                list
            };
        },
    },

    ShoppingList: {
        items: (parent: IShoppingListDocument) => {
            return [...parent.items].sort((a, b) => {
                // Sort by category first
                const categoryDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
                if (categoryDiff !== 0) return categoryDiff;
                
                // Then incomplete before completed
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                
                // Finally by added date
                return b.addedAt.getTime() - a.addedAt.getTime();
            });
        },

            
    itemStats: (parent :IShoppingListDocument) => ({
        ...parent.itemStats,
        // Transform object into array of category entries
        itemsByCategory: Object.entries(parent.itemStats.itemsByCategory).map(([category, stats]) => ({
            category,
            stats
        }))
    })
    },

    ShoppingListItem: {
        ingredient: async (parent: IShoppingListItem) => {
            if (!parent.ingredient) return null;
            return Ingredient.findById(parent.ingredient);
        },
        
        addedBy: async (parent: IShoppingListItem) => {
            return User.findById(parent.addedBy);
        }
    }
};
