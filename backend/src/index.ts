// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { auth } from './config/firebase';
import { connectDB } from './config/db';
import { Context } from './types/context';
import { recipeResolvers } from './graphql/resolvers/recipe';
import { ingredientResolvers } from './graphql/resolvers/ingredient';
import { recipeTypeDefs } from './graphql/schema/recipe';
import { ingredientTypeDefs } from './graphql/schema/ingredient';
import { userResolvers } from './graphql/resolvers/user';
import { typeDefs as userTypeDefs } from './graphql/schema/user';
import { tableTypeDefs } from './graphql/schema/table';
import { tableResolvers } from './graphql/resolvers/table';
import { mealPlanTypeDefs } from './graphql/schema/mealPlan';
import { mealPlanResolvers } from './graphql/resolvers/mealPlan';
import { ApplicationError } from './utils/errors';
import { errorTypeDefs } from './graphql/schema/error';
import { recipeHistoryTypeDefs } from './graphql/schema/recipeHistory';
import { recipeHistoryResolvers } from './graphql/resolvers/recipeHistory';
import { shoppingListTypeDefs } from './graphql/schema/shoppingList';
import { shoppingListResolvers } from './graphql/resolvers/shoppingList';
import { recipeNoteTypeDefs } from './graphql/schema/recipeNote';
import { recipeNoteResolvers } from './graphql/resolvers/recipeNote';
import { cookingSessionTypeDefs } from './graphql/schema/cookingSession';
import { cookingSessionResolvers } from './graphql/resolvers/cookingSession';
import { startCleanupJob } from './utils/cleanupCookingSessions';
import { badgeTypeDefs } from './graphql/schema/badge';
import { badgeResolvers } from './graphql/resolvers/badge';
import { Badge } from './models/Badge';
import { NotificationWatcherService } from './services/NotificationWatcherService';
import { notificationTypeDefs } from './graphql/schema/notification';
import { notificationResolvers } from './graphql/resolvers/notification';
import { scalarResolvers, scalarTypeDefs } from './graphql/scalars';

// Combine type definitions
const typeDefs = [
    scalarTypeDefs,
    recipeTypeDefs,
    ingredientTypeDefs,
    userTypeDefs,
    tableTypeDefs,
    mealPlanTypeDefs,
    errorTypeDefs,
    recipeHistoryTypeDefs,
    shoppingListTypeDefs,
    recipeNoteTypeDefs,
    cookingSessionTypeDefs,
    badgeTypeDefs,
    notificationTypeDefs
];

// Combine resolvers
const resolvers = {
    ...scalarResolvers,
    Query: {
        ...recipeResolvers.Query,
        ...ingredientResolvers.Query,
        ...userResolvers.Query,
        ...tableResolvers.Query,
        ...mealPlanResolvers.Query,
        ...recipeHistoryResolvers.Query,
        ...shoppingListResolvers.Query,
        ...recipeNoteResolvers.Query,
        ...cookingSessionResolvers.Query,
        ...badgeResolvers.Query,
        ...notificationResolvers.Query
    },
    Mutation: {
        ...recipeResolvers.Mutation,
        ...userResolvers.Mutation,
        ...tableResolvers.Mutation,
        ...mealPlanResolvers.Mutation,
        ...recipeHistoryResolvers.Mutation,
        ...shoppingListResolvers.Mutation,
        ...recipeNoteResolvers.Mutation,
        ...cookingSessionResolvers.Mutation,
       ...badgeResolvers.Mutation,
        ...notificationResolvers.Mutation
    },
    Recipe: {
        ...recipeResolvers.Recipe,
        ...recipeNoteResolvers.Recipe
    },
    Review: recipeResolvers.Review,
    UserProfile: userResolvers.UserProfile,
    Ingredient: ingredientResolvers.Ingredient,
    Table: tableResolvers.Table,
    MealRecipe: mealPlanResolvers.MealRecipe,
    ShoppingList: shoppingListResolvers.ShoppingList,
    ShoppingListItem: shoppingListResolvers.ShoppingListItem,
    CookingSession: cookingSessionResolvers.CookingSession,
    Badge: badgeResolvers.Badge,
};

const startServer = async () => {
    try {
        await connectDB();

        await NotificationWatcherService.start();
        
        // Start the cleanup job for abandoned cooking sessions
        const cleanupJob = startCleanupJob();
        
        const server = new ApolloServer<Context>({
            typeDefs,
            resolvers,
            introspection: true,
            formatError: (formattedError) => {
                if (formattedError.extensions?.originalError) {
                    const error = formattedError.extensions.originalError as ApplicationError;
                    
                    if (error instanceof ApplicationError) {
                        return {
                            message: error.message,
                            extensions: {
                                code: error.details?.code || 'INTERNAL_SERVER_ERROR',
                                ...error.details
                            }
                        };
                    }
                }
                return formattedError;
            }
        });

        const { url } = await startStandaloneServer(server, {
            context: async ({ req }) => {
                // Development bypass
                if (process.env.NODE_ENV === 'development' && req.headers.authorization?.startsWith('Bearer test-')) {
                    return {
                        user: {
                            uid: 'test-uid-123',
                            email: 'newemail@admin.com'
                        }
                    };
                }
                
                const token = req.headers.authorization?.split('Bearer ')[1];
                let user;
                
                if (token) {
                    try {
                        const decodedToken = await auth.verifyIdToken(token);
                        user = {
                            uid: decodedToken.uid,
                            email: decodedToken.email
                        };
                    } catch (error) {
                        console.error('Error verifying token:', error);
                    }
                }
                
                return { user };
            },
            listen: { port: parseInt(process.env.PORT || '4000') }
        });
        
        console.log(`🚀 Server ready at ${url}`);
        console.log(`📘 Query your GraphQL API at: ${url}`);

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Cleaning up...');
            clearInterval(cleanupJob);
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();