
// src/graphql/resolvers/table.ts
import { Types } from 'mongoose';
import { Table, TablePrivacy, CollaboratorRole, ITable, ICollaborator, ITableDocument } from '../../models/Table';
import { User } from '../../models/User';
import { IRecipe, Recipe } from '../../models/Recipe';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';
import { azureStorage } from '../../config/azureStorage';
import { auth } from 'firebase-admin';
import { exists } from 'fs';
import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';

// Constants for limits
const LIMITS = {
  TABLES_PER_USER: 20,
  COLLABORATIONS_PER_USER: 20,
  COLLABORATORS_PER_TABLE: 2,
  RECIPES_PER_TABLE: 100
};

enum TableSortOption {
  TITLE = 'TITLE',
  LAST_ACTIVITY = 'ACTIVITY',
  CREATED_AT = 'CREATED'
}

enum TableFilter {
  GROUP = 'GROUP',
  SECRET = 'SECRET',
  ALL = 'ALL'
}

interface MyTablesFilter {
  type?: TableFilter;
  sortBy?: TableSortOption;
}

interface CollaboratorQuery {
  'collaborators.userId': Types.ObjectId | { $ne: Types.ObjectId };
}

interface TableQuery {
  'collaborators.userId': Types.ObjectId;
  privacy?: TablePrivacy;
  $and?: Array<CollaboratorQuery | { collaborators: { $elemMatch: { userId: { $ne: Types.ObjectId } } } }>;
  'collaborators.role'?: string;
  $expr?: { $eq: [{ $size: string }, number] };
}

enum SavedRecipeSortBy {
  SAVE_DATE = 'SAVE_DATE',        // When the user saved it
  RECIPE_DATE = 'RECIPE_DATE',    // When recipe was created
  TITLE = 'TITLE',                // Alphabetical by recipe title
  RATING = 'RATING',              // By recipe rating
  DIFFICULTY = 'DIFFICULTY'       // By recipe difficulty
}

enum SavedRecipeFilter {
  ALL = 'ALL',
  OWNED_TABLES = 'OWNED_TABLES',      // Only from tables I own
  COLLABORATED = 'COLLABORATED',       // From tables where I'm collaborator
  PUBLIC = 'PUBLIC',                   // From public tables
  PRIVATE = 'PRIVATE'                  // From private tables
}

interface SavedRecipesFilter {
  tablePrivacy?: TablePrivacy;
  difficulty?: number;
  tags?: string[];
  sortBy?: SavedRecipeSortBy;
  filter?: SavedRecipeFilter;
}

type SortFields = 'createdAt' | 'title' | 'reviewStats.avgRating' | 'difficulty';
type SortDirection = 1 | -1;
type SortOptions = Partial<Record<SortFields, SortDirection>>;

interface SavedRecipe {
  recipe: IRecipe;
  savedAt: Date;
  tableId: string;
  tableName: string;
}

export const tableResolvers = {
  Query: {
    table: async (_: never, { id }: { id: string }, context: Context) => {
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
      
      const table = await Table.findById(id);
      if (!table) throw new ApplicationError('Table not found', 404);
      
      
      
      // Check access permissions
      if (table.privacy === TablePrivacy.PRIVATE) {
        const isCollaborator = table.collaborators.some(
          c => c.userId.equals(dbUser._id)
        );
        if (!isCollaborator) {
          throw new ApplicationError('Not authorized to view this table', 403);
        }
      }
      
      return table;
    },
    
    
    myTables: async (
      _: never,
      { filter, limit = 10, offset = 0 }: { filter?: MyTablesFilter; limit: number; offset: number },
      context: Context
    ) => {
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
    
      // Build query with proper type
      let query: TableQuery = {
        'collaborators.userId': dbUser._id,
      };
    
      // Add filter based on type
      if (filter?.type) {
        switch (filter.type) {
          case TableFilter.GROUP:
            query = {
              ...query,
              $and: [
                { 'collaborators.userId': dbUser._id },
                {
                  collaborators: {
                    $elemMatch: {
                      userId: { $ne: dbUser._id },
                    },
                  },
                },
              ],
            };
            break;
          case TableFilter.SECRET:
            query = {
              ...query,
              privacy: TablePrivacy.PRIVATE,
              'collaborators.role': CollaboratorRole.OWNER,
              $expr: { $eq: [{ $size: '$collaborators' }, 1] },
            };
            break;
          case TableFilter.ALL:
            // No additional filters needed
            break;
        }
      }
    
      let sort: Record<string, 1 | -1> = { lastActivityAt: -1 };
    
      if (filter?.sortBy) {
        switch (filter.sortBy) {
          case TableSortOption.TITLE:
            sort = { title: 1 };
            break;
          case TableSortOption.CREATED_AT:
            sort = { createdAt: -1 };
            break;
          case TableSortOption.LAST_ACTIVITY:
          default:
            sort = { lastActivityAt: -1 };
            break;
        }
      }
    
      // Get tables as Mongoose documents (do not use .lean() or .toObject())
      const tables = await Table.find(query)
        .sort(sort) // Use the dynamically defined sort
        .skip(offset)
        .limit(limit);
    
      // Return the tables directly (they are Mongoose documents)
      return tables;
    },

    cookbookStats: async (_: never, __:never, context:Context) => {
      const user = requireAuth(context);
      const dbUser = await User.findOne({firebaseUid: user.uid});
      if (!dbUser) throw new ApplicationError('User not found', 404);
    
      const unplannedTable = await Table.findOne({
        'collaborators.userId': dbUser._id,
        'collaborators.role': CollaboratorRole.OWNER,
        title: 'Unplanned Meals'
      });
    
      const allUserTables = await Table.find({
        'collaborators.userId': dbUser._id 
      });
    
      const totalSavedRecipes = allUserTables.reduce((acc, table) => 
        acc + table.recipes.length, 0);
    
      return {
        unplannedMeals: {
          exists: !!unplannedTable,
          recipeCount: unplannedTable?.recipes?.length || 0,
          tableId: unplannedTable?._id
        },
        savedRecipes: {
          total: totalSavedRecipes,
          tableCount: allUserTables.length
        }
      };
    },


    savedRecipes: async (_: never,
      { 
        filter,
        limit = 10, 
        offset = 0 
      }: { 
        filter?: SavedRecipesFilter;
        limit: number; 
        offset: number;
      },
      context: Context
    ) => {
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
    
      // Build table query based on filter
      const tableQuery: any = {
        'collaborators.userId': dbUser._id
      };
    
      if (filter?.filter) {
        switch (filter.filter) {
          case SavedRecipeFilter.OWNED_TABLES:
            tableQuery['collaborators'] = {
              $elemMatch: {
                userId: dbUser._id,
                role: CollaboratorRole.OWNER
              }
            };
            break;
          case SavedRecipeFilter.COLLABORATED:
            tableQuery['collaborators'] = {
              $elemMatch: {
                userId: dbUser._id,
                role: { $ne: CollaboratorRole.OWNER }
              }
            };
            break;
          case SavedRecipeFilter.PUBLIC:
            tableQuery.privacy = TablePrivacy.PUBLIC;
            break;
          case SavedRecipeFilter.PRIVATE:
            tableQuery.privacy = TablePrivacy.PRIVATE;
            break;
        }
      }
    
      // Find tables and collect recipes
      const tables = await Table.find(tableQuery);
      
      // Collect recipe entries with metadata
      const recipeEntries = tables.flatMap(table => 
        table.recipes
          .filter(recipe => recipe.addedBy.equals(dbUser._id))
          .map(recipe => ({
            recipeId: recipe.recipeId,
            savedAt: recipe.addedAt,
            tableId: table._id,
            tableName: table.title
          }))
      );
    
      // Remove duplicates (keep most recent)
      const uniqueRecipes = Array.from(
        recipeEntries.reduce((map, entry) => {
          const existing = map.get(entry.recipeId.toString());
          if (!existing || existing.savedAt < entry.savedAt) {
            map.set(entry.recipeId.toString(), entry);
          }
          return map;
        }, new Map())
        .values()
      );
    
      // Build recipe query
      const recipeQuery: any = {
        _id: { $in: uniqueRecipes.map(entry => entry.recipeId) },
        isActive: true
      };
    
      if (filter?.difficulty) {
        recipeQuery.difficulty = filter.difficulty;
      }
    
      if (filter?.tags?.length) {
        recipeQuery['tags.name'] = { $in: filter.tags };
      }
    
      // Fetch recipes (no sorting at DB level)
      const recipes = await Recipe.find(recipeQuery);
    
      // Custom sorting function
      const sortRecipes = (a: SavedRecipe, b: SavedRecipe) => {
        if (!filter?.sortBy || filter.sortBy === SavedRecipeSortBy.SAVE_DATE) {
          // Default sort by save date
          return b.savedAt.getTime() - a.savedAt.getTime();
        }
    
        switch (filter.sortBy) {
          case SavedRecipeSortBy.RECIPE_DATE:
            const dateA = new Date(a.recipe.createdAt).getTime();
            const dateB = new Date(b.recipe.createdAt).getTime();
            return -(dateB - dateA); // Return the recipes that were created há mais tempo
    
          case SavedRecipeSortBy.TITLE:
            // Sort alphabetically by title
            return a.recipe.title.localeCompare(b.recipe.title);
    
          case SavedRecipeSortBy.RATING:
            // Sort by rating, if equal sort by number of reviews
            const ratingDiff = (b.recipe.reviewStats.avgRating || 0) - (a.recipe.reviewStats.avgRating || 0);
            if (ratingDiff === 0) {
              return (b.recipe.reviewStats.reviewCount || 0) - (a.recipe.reviewStats.reviewCount || 0);
            }
            return ratingDiff;
    
          case SavedRecipeSortBy.DIFFICULTY:
            // Sort by difficulty, if equal sort alphabetically
            const difficultyDiff = a.recipe.difficulty - b.recipe.difficulty;
            if (difficultyDiff === 0) {
              return a.recipe.title.localeCompare(b.recipe.title);
            }
            return difficultyDiff;
    
          default:
            return b.savedAt.getTime() - a.savedAt.getTime();
        }
      };
    
      // Combine recipe data with save info
      const recipesWithSaveInfo = recipes.map(recipe => {
        const saveInfo = uniqueRecipes.find(entry => 
          entry.recipeId.equals(recipe._id)
        );
        
        return {
          recipe: recipe.toObject(),
          savedAt: saveInfo?.savedAt,
          tableId: saveInfo?.tableId,
          tableName: saveInfo?.tableName
        };
      });
    
      // Apply sorting and pagination
      const sortedAndPaginatedRecipes = recipesWithSaveInfo
        .sort(sortRecipes)
        .slice(offset, offset + limit);
    
      // Calculate stats
      const stats = {
        byDifficulty: await Recipe.aggregate([
          { $match: recipeQuery },
          {
            $group: {
              _id: '$difficulty',
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              level: '$_id',
              count: 1,
              _id: 0
            }
          }
        ])
      };
    
      return {
        recipes: sortedAndPaginatedRecipes,
        totalCount: uniqueRecipes.length,
        stats
      };
    },
    
    // only shows accessible tables with default sorting
    userTables: async (_: never, 
      { userId, limit = 10, offset = 0 }: { userId: string; limit: number; offset: number }, 
      context: Context
    ) => {
      // Require authentication
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
      
      // Find target user
      const targetUser = await User.findOne({ _id: userId });
      if (!targetUser) throw new ApplicationError('User not found', 404);
      
      
      const query: any = {
        'collaborators.userId': targetUser._id,
        $or: [
          { privacy: TablePrivacy.PUBLIC },
          { 'collaborators.userId': dbUser._id }
        ]
      };
      
      return Table.find(query)
      .sort({ lastActivityAt: -1 })
      .skip(offset)
      .limit(limit);
    },
    
    myTableStats: async (_: never, __: never, context: Context) => {
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
      
      const stats = await Table.aggregate([
        {
          $match: {
            'collaborators.userId': dbUser._id
          }
        },
        {
          $group: {
            _id: null,
            // All my tables
            totalTables: { $sum: 1 },
            
            // Tables with collaborators (regardless of privacy)
            groupTables: {
              $sum: {
                $cond: [{ $gt: [{ $size: '$collaborators' }, 1] }, 1, 0]
              }
            },
            
            // Private tables with no other collaborators
            secretTables: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$privacy', TablePrivacy.PRIVATE] },
                      { $eq: [{ $size: '$collaborators' }, 1] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            
            // All public tables
            publicTables: {
              $sum: {
                $cond: [{ $eq: ['$privacy', TablePrivacy.PUBLIC] }, 1, 0]
              }
            },
            
            // All private tables (regardless of collaborators)
            privateTables: {
              $sum: {
                $cond: [{ $eq: ['$privacy', TablePrivacy.PRIVATE] }, 1, 0]
              }
            }
          }
        }
      ]);
      
      return stats[0] ?? { 
        totalTables: 0, 
        groupTables: 0, 
        secretTables: 0, 
        publicTables: 0,
        privateTables: 0
      };
    },
    
    userTableStats: async (_: never, { userId }: { userId: string }, context: Context) => {
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      if (!dbUser) throw new ApplicationError('User not found', 404);
      
      const targetUser = await User.findOne({ _id: userId });
      if (!targetUser) throw new ApplicationError('User not found', 404);
      
      const stats = await Table.aggregate([
        {
          $match: {
            'collaborators.userId': targetUser._id,
            // Only match tables we can see
            $or: [
              { privacy: TablePrivacy.PUBLIC },
              { 
                'collaborators.userId': dbUser._id,
                privacy: { $ne: TablePrivacy.PRIVATE }
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            // Total accessible tables (excluding private ones)
            totalTables: {
              $sum: {
                $cond: [
                  { $ne: ['$privacy', TablePrivacy.PRIVATE] },
                  1,
                  0
                ]
              }
            },
            
            // Public tables with collaborators
            groupTables: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$privacy', TablePrivacy.PUBLIC] },
                      { $gt: [{ $size: '$collaborators' }, 1] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            
            // All public tables
            publicTables: {
              $sum: {
                $cond: [{ $eq: ['$privacy', TablePrivacy.PUBLIC] }, 1, 0]
              }
            }
          }
        }
      ]);
      
      return stats[0] ?? { 
        totalTables: 0, 
        groupTables: 0, 
        publicTables: 0,
        // secretTables: null  // Explicitly null for other users
      };
    },
    
    searchTables: async (_: never,
      { query, limit = 10, offset = 0 }: { query?: string; limit: number; offset: number }
    ) => {
      interface TableFilter {
        privacy: TablePrivacy;
        $or?: Array<{[key: string]: { $regex: string; $options: string }}>;
      }
      
      const filter: TableFilter = { privacy: TablePrivacy.PUBLIC };
      
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { subtitle: { $regex: query, $options: 'i' } }
        ];
      }
      
      return Table.find(filter)
      .sort({ lastActivityAt: -1 })
      .skip(offset)
      .limit(limit);
    }
  },
  
  Table: {
    owner: async (parent: ITableDocument) => {
      return parent.owner ? User.findById(parent.owner) : null;
    },

    myRole: async (parent: ITableDocument, _: never, context: Context) => {
      const authUser = await User.findOne({ firebaseUid: context.user?.uid });
      if (!authUser) return null;

      const collaborator = parent.collaborators.find(
        (c) => new Types.ObjectId(c.userId).equals(authUser._id)
      );

      return collaborator?.role ?? null;
    },

    collaborators: async (parent: ITableDocument) => {
      const collaborators = await Promise.all(
        parent.collaborators.map(async (collab: ICollaborator) => ({
          user: await User.findById(collab.userId),
          addedBy: await User.findById(collab.addedBy),
          role: collab.role || CollaboratorRole.VIEWER, // Default to VIEWER if role is missing
          addedAt: collab.addedAt,
        }))
      );
      return collaborators;
    },

    isCollaborator: async (parent: ITableDocument, _: never, context: Context) => {
      const authUser = await User.findOne({ firebaseUid: context.user?.uid });
      if (!authUser) return false;

      // Ensure parent is a Mongoose document
      if (!(parent instanceof mongoose.Document)) {
        throw new Error('Parent is not a valid Table document');
      }

      // Use the isUserCollaborator method
      return parent.isUserCollaborator(authUser._id);
    },

    canEdit: async (parent: ITableDocument, _: never, context: Context) => {
      const authUser = await User.findOne({ firebaseUid: context.user?.uid });
      if (!authUser) return false;

      // Ensure parent is a Mongoose document
      if (!(parent instanceof mongoose.Document)) {
        throw new Error('Parent is not a valid Table document');
      }

      return parent.canUserEdit(authUser._id);
    },

    recipes: async (parent: ITableDocument) => {
      try {
        // Log for debugging
        console.log('Table recipes:', parent.recipes);
    
        // If there are no recipes, return an empty array
        if (!parent.recipes || parent.recipes.length === 0) {
          return [];
        }
    
        // Extract recipe IDs
        const recipeIds = parent.recipes.map((r) => r.recipeId);
        console.log('Looking for recipe IDs:', recipeIds);
    
        // Fetch all recipes at once
        const recipes = await Recipe.find({
          _id: { $in: recipeIds },
        });
        console.log('Found recipes:', recipes.length);
    
        // Create a map for quick lookup
        const recipeMap = new Map(
          recipes.map((recipe) => [recipe._id.toString(), recipe])
        );
    
        // Fetch users for addedBy fields
        const addedByUserIds = parent.recipes.map((r) => r.addedBy);
        const addedByUsers = await User.find({
          _id: { $in: addedByUserIds },
        });
        const userMap = new Map(
          addedByUsers.map((user) => [user._id.toString(), user])
        );
    
        // Return formatted array maintaining the original order
        return parent.recipes
          .map((tableRecipe) => {
            const recipe = recipeMap.get(tableRecipe.recipeId.toString());
            if (!recipe) {
              console.log('Recipe not found for ID:', tableRecipe.recipeId);
              return null;
            }
    
            const addedByUser = userMap.get(tableRecipe.addedBy.toString());
            if (!addedByUser) {
              console.log('User not found for ID:', tableRecipe.addedBy);
              return null;
            }
    
            return {
              recipe,
              addedBy: addedByUser, // Return the User object
              addedAt: tableRecipe.addedAt,
            };
          })
          .filter((entry) => entry !== null); // Remove null entries
      } catch (error) {
        console.error('Error resolving table recipes:', error);
        throw new ApplicationError('Failed to resolve table recipes', 500);
      }
    },

    recentThumbnails: (parent: ITableDocument) => {
      return parent.recentThumbnails.map((url: string) =>
        // Add width and height parameters for thumbnails
        azureStorage.getSecureUrl(url) + '&w=300&h=300&format=webp'
      );
    },
  },


Mutation: {
  createTable: async (_: never,
    { input }: { input: { title: string; subtitle?: string; emoji?: string; privacy?: TablePrivacy } },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: authUser.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    
    // Check user's table limit
    const userTableCount = await Table.countDocuments({
      'collaborators.userId': dbUser._id,
      'collaborators.role': CollaboratorRole.OWNER
    });
    
    if (userTableCount >= LIMITS.TABLES_PER_USER) {
      throw new ApplicationError(
        `Maximum tables limit (${LIMITS.TABLES_PER_USER}) reached`, 
        400
      );
    }
    
    // Check for duplicate table names for this user
    const existingTable = await Table.findOne({
      'collaborators.userId': dbUser._id,
      'collaborators.role': CollaboratorRole.OWNER,
      title: input.title,
    });
    
    if (existingTable) {
      throw new ApplicationError(
        'You already have a table with this name. Please choose a different name.',
        400
      );
    }
    
    // Create table with user as owner
    const table = await Table.create({
      ...input,
      collaborators: [{
        userId: dbUser._id,
        role: CollaboratorRole.OWNER,
        addedAt: new Date(),
        addedBy: dbUser._id
      }]
    });
    
    return table;
  },
  
  updateTable: async (_: never,
    { id, input }: { id: string; input: { title?: string; subtitle?: string; emoji?: string; privacy?: TablePrivacy } },
    context: Context
  ) => {
   try {
     if (await isSystemTable(id)) {
       throw new ApplicationError(
         'Cannot modify system tables',
         403,
         { code: 'SYSTEM_TABLE_PROTECTED' }
       );
     }
     const authUser = requireAuth(context);
     const dbUser = await User.findOne({ firebaseUid: authUser.uid });
     
     const table = await Table.findById(id);
     if (!table) throw new ApplicationError('Table not found', 404);
     
     // Check if user is owner or editor
     const userRole = table.collaborators.find(
       c => c.userId.equals(dbUser?._id)
     )?.role;
     
     if (!userRole || userRole === CollaboratorRole.VIEWER) {
       throw new ApplicationError('Not authorized to update this table', 403);
     }
     
     if (userRole === CollaboratorRole.EDITOR && input.privacy) {
       throw new ApplicationError('Editors cannot change table privacy', 403);
     }
     
     return Table.findByIdAndUpdate(id, input, { new: true });
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
  
  deleteTable: async (_: never,
    { id }: { id: string },
    context: Context
  ) => {
try {
  if (await isSystemTable(id)) {
    throw new ApplicationError(
      'Cannot delete system tables',
      403,
      { code: 'SYSTEM_TABLE_PROTECTED' }
    );
  }
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      
      const table = await Table.findById(id);
      if (!table) throw new ApplicationError('Table not found', 404);
      
      // Only owner can delete table
      const isOwner = table.collaborators.some(
        c => c.userId.equals(dbUser?._id) && c.role === CollaboratorRole.OWNER
      );
      
      if (!isOwner) {
        throw new ApplicationError('Only the owner can delete this table', 403);
      }
      
      await Table.findByIdAndDelete(id);
      return true;
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
  
  addRecipeToTable: async (_: never,
    { tableId, recipeId }: { tableId: string; recipeId: string },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: authUser.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    
    // Validate table and permissions
    const table = await Table.findById(tableId);
    if (!table) throw new ApplicationError('Table not found', 404);
    
    const userRole = table.collaborators.find(
      c => c.userId.equals(dbUser?._id)
    )?.role;
    
    if (!userRole || userRole === CollaboratorRole.VIEWER) {
      throw new ApplicationError('Not authorized to modify this table', 403);
    }
    
    // Validate recipe exists and is active
    const recipe = await Recipe.findOne({ _id: recipeId, isActive: true });
    if (!recipe) throw new ApplicationError('Recipe not found', 404);
    
    // Check if recipe is already in table
    if (table.recipes.some(r => r.recipeId.equals(new Types.ObjectId(recipeId)))) {
      throw new ApplicationError('Recipe already exists in this table', 400);
    }
    
    // Check recipes limit
    if (table.recipes.length >= LIMITS.RECIPES_PER_TABLE) {
      throw new ApplicationError(
        `Maximum recipes limit (${LIMITS.RECIPES_PER_TABLE}) reached`,
        400
      );
    }
    
    // Update recipe list and thumbnails
    table.recipes.push({
      recipeId: new Types.ObjectId(recipeId),
      addedBy: dbUser._id,
      addedAt: new Date()
    });
    table.lastActivityAt = new Date();
    
    return table.save();
  },
  
  // Create Unplanned Meals table if it doesn't exist when adding a recipe to it
  addRecipeToUnplannedMeals: async (_: never,
    {recipeId} : {recipeId: string},
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const dbUser = await User.findOne({firebaseUid: authUser.uid});
    if (!dbUser) throw new ApplicationError('User not found', 404);
  
    let unplannedTable = await Table.findOne({
      'collaborators.userId': dbUser._id,
      'collaborators.role': CollaboratorRole.OWNER,
      title: 'Unplanned Meals'
    });
    
    if (!unplannedTable) {
      unplannedTable = await Table.create({
        title: 'Unplanned Meals',
        emoji: '📋',
        privacy: TablePrivacy.PRIVATE,
        collaborators: [{
          userId: dbUser._id,
          role: CollaboratorRole.OWNER,
          addedAt: new Date(),
          addedBy: dbUser._id
        }]
      });
    }

    return tableResolvers.Mutation.addRecipeToTable(
      _,
      { 
        tableId: unplannedTable.id, 
        recipeId 
      },
      context
    );
  },

  removeRecipeFromTable: async (_: never,
    { tableId, recipeId }: { tableId: string; recipeId: string },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: authUser.uid });
    
    const table = await Table.findById(tableId);
    if (!table) throw new ApplicationError('Table not found', 404);
    
    // Check permissions
    const userRole = table.collaborators.find(
      c => c.userId.equals(dbUser?._id)
    )?.role;
    
    if (!userRole || userRole === CollaboratorRole.VIEWER) {
      throw new ApplicationError('Not authorized to modify this table', 403);
    }
    
    // Check if recipe exists in table
    const recipeExists = table.recipes.some(recipe => 
      recipe.recipeId.equals(new Types.ObjectId(recipeId))
    );
    
    if (!recipeExists) {
      throw new ApplicationError('Recipe not found in this table', 404);
    }
    
    // Remove recipe from array
    table.recipes = table.recipes.filter(recipe => 
      !recipe.recipeId.equals(new Types.ObjectId(recipeId))
    );
    table.lastActivityAt = new Date();
    
    return table.save();
  },
  
  addTableCollaborator: async (_: never,
    { input }: { input: { tableId: string; userId: string; role: CollaboratorRole } },
    context: Context
  ) => {
try {
  if (await isSystemTable(input.tableId)) {
    throw new ApplicationError(
      'Cannot add collaborators to system tables',
      403,
      { code: 'SYSTEM_TABLE_PROTECTED' }
    );
  }
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      
      // Validate table and owner permissions
      const table = await Table.findById(input.tableId);
      if (!table) throw new ApplicationError('Table not found', 404);
      
      // Check if the table has reached the maximum number of collaborators
      if (table.collaborators.length >= LIMITS.COLLABORATORS_PER_TABLE) {
        throw new ApplicationError(
          `Maximum collaborators limit (${LIMITS.COLLABORATORS_PER_TABLE}) reached for this table`,
          400
        );
      }  
      
      const isOwner = table.collaborators.some(
        c => c.userId.equals(dbUser?._id) && c.role === CollaboratorRole.OWNER
      );
      if (!isOwner) {
        throw new ApplicationError('Only the owner can manage collaborators', 403);
      }
      
      // Validate target user exists
      const targetUser = await User.findById(input.userId);
      if (!targetUser) throw new ApplicationError('User not found', 404);
      
      // Check if user is already a collaborator
      if (table.collaborators.some(c => c.userId.equals(targetUser._id))) {
        throw new ApplicationError('User is already a collaborator', 400);
      }
      
      // Check user's collaboration limit
      const userCollabCount = await Table.countDocuments({
        'collaborators.userId': targetUser._id
      });
      
      if (userCollabCount >= LIMITS.COLLABORATIONS_PER_USER) {
        throw new ApplicationError(
          `User has reached maximum collaborations limit (${LIMITS.COLLABORATIONS_PER_USER})`,
          400
        );
      }
      
      // Add collaborator
      return Table.findByIdAndUpdate(
        input.tableId,
        { 
          $push: { 
            collaborators: {
              userId: targetUser._id,
              role: input.role,
              addedAt: new Date(),
              addedBy: dbUser?._id
            }
          },
          lastActivityAt: new Date()
        },
        { new: true }
      );
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
  
  removeTableCollaborator: async (_: never,
    { tableId, userId }: { tableId: string; userId: string },
    context: Context
  ) => {
try {
  if (await isSystemTable(tableId)) {
    throw new ApplicationError(
      'Cannot remove collaborators from system tables',
      403,
      { code: 'SYSTEM_TABLE_PROTECTED' }
    );
  }
      const authUser = requireAuth(context);
      const dbUser = await User.findOne({ firebaseUid: authUser.uid });
      
      const table = await Table.findById(tableId);
      if (!table) throw new ApplicationError('Table not found', 404);
      
      // Check if target is the owner
      const targetCollaborator = table.collaborators.find(
        c => c.userId.equals(new Types.ObjectId(userId))
      );
      
      if (!targetCollaborator) {
        throw new ApplicationError('User is not a collaborator', 404);
      }
      
      if (targetCollaborator.role === CollaboratorRole.OWNER) {
        throw new ApplicationError('Cannot remove the owner', 403);
      }
      
      // Check permissions (only owner can remove collaborators)
      const isOwner = table.collaborators.some(
        c => c.userId.equals(dbUser?._id) && c.role === CollaboratorRole.OWNER
      );
      
      if (!isOwner) {
        throw new ApplicationError('Only the owner can remove collaborators', 403);
      }
      
      
      table.collaborators = table.collaborators.filter(
        c => !c.userId.equals(new Types.ObjectId(userId))
      );
      table.lastActivityAt = new Date();
      
      return table.save();
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
  
  updateTableCollaboratorRole: async (_: never,
    { tableId, userId, role }: { tableId: string; userId: string; role: CollaboratorRole },
    context: Context
  ) => {
   try {
    if (await isSystemTable(tableId)) {
      throw new ApplicationError(
        'Cannot modify collaborator roles in system tables',
        403,
        { code: 'SYSTEM_TABLE_PROTECTED' }
      );
    }
     const authUser = requireAuth(context);
     const dbUser = await User.findOne({ firebaseUid: authUser.uid });
     
     const table = await Table.findById(tableId);
     if (!table) throw new ApplicationError('Table not found', 404);
     
     // Only owner can update roles
     const isOwner = table.collaborators.some(
       c => c.userId.equals(dbUser?._id) && c.role === CollaboratorRole.OWNER
     );
     if (!isOwner) {
       throw new ApplicationError('Only the owner can update roles', 403);
     }
     
     // Cannot change owner's role
     const targetCollaborator = table.collaborators.find(
       c => c.userId.equals(new Types.ObjectId(userId))
     );
     
     if (!targetCollaborator) {
       throw new ApplicationError('User is not a collaborator', 404);
     }
     
     if (targetCollaborator.role === CollaboratorRole.OWNER) {
       throw new ApplicationError('Cannot change owner\'s role', 403);
     }
     
     // Update role
     return Table.findOneAndUpdate(
       { 
         _id: tableId,
         'collaborators.userId': new Types.ObjectId(userId)
       },
       { 
         $set: { 'collaborators.$.role': role },
         lastActivityAt: new Date()
       },
       { new: true }
     );
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
}
};

// Helper function to check if table is a system table
const isSystemTable = async (tableId: string): Promise<boolean> => {
  const table = await Table.findById(tableId);
  return table?.title === 'Unplanned Meals';
};