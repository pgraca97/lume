// src/graphql/resolvers/cookingSession.ts
import { Types } from 'mongoose';
import { GraphQLError } from 'graphql';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';
import { 
    CookingSession, 
    SessionStatus,
    CompletionSource,
    ICookingSession 
} from '../../models/CookingSession';
import { IRecipe, Recipe } from '../../models/Recipe';
import { User } from '../../models/User';
import { Badge, BadgeStatus, UserBadgeProgress } from '../../models/Badge';
import { updateBudgetMasterProgress } from '../../utils/badgeUpdates';

// Get authenticated user helper
const getAuthUser = async (context: Context) => {
    const user = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: user.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    return dbUser;
};

// Validate session access helper
const validateSessionAccess = async (sessionId: string, userId: Types.ObjectId) => {
    const session = await CookingSession.findById(sessionId);
    if (!session) {
        throw new ApplicationError('Cooking session not found', 404);
    }
    if (!session.userId.equals(userId)) {
        throw new ApplicationError('Not authorized to access this session', 403);
    }
    return session;
};

export const cookingSessionResolvers = {
    Query: {
        incompleteCookingSessions: async (_: never, __: never, context: Context) => {
            const dbUser = await getAuthUser(context);
            
            // Find sessions that are in progress or paused
            return CookingSession.find({
                userId: dbUser._id,
                status: {
                    $in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED]
                }
            }).sort({ lastActiveAt: -1 });
        },
        
        cookingSession: async (_: never, 
            { id }: { id: string }, 
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            return validateSessionAccess(id, dbUser._id);
        },
        
        recipeCookingHistory: async (_: never,
            { recipeId }: { recipeId: string },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            
            return CookingSession.find({
                userId: dbUser._id,
                recipeId: new Types.ObjectId(recipeId)
            }).sort({ startedAt: -1 });
        }
    },
    
    Mutation: {
        startCookingSession: async (_: never,
            { input }: { 
                input: { 
                    recipeId: string; 
                    servings: number;
                    notes?: string;
                }
            },
            context: Context
        ) => {
            try {
                const dbUser = await getAuthUser(context);
                
                // Check if recipe exists
                const recipe = await Recipe.findById(input.recipeId);
                if (!recipe) {
                    throw new ApplicationError('Recipe not found', 404);
                }
                
                // Check for existing incomplete session
                const existingSession = await CookingSession.findOne({
                    userId: dbUser._id,
                    recipeId: new Types.ObjectId(input.recipeId),
                    status: {
                        $in: [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED]
                    }
                });
                
                if (existingSession) {
                    throw new ApplicationError(
                        'An incomplete session already exists for this recipe',
                        400,
                        { existingSessionId: existingSession._id }
                    );
                }
                
                // Initialize steps array based on recipe
                const stepsProgress = recipe.steps.map((_, index) => ({
                    stepIndex: index,
                    completed: false
                }));
                
                
                // Create new session with initialized steps
                const session = await CookingSession.create({
                    userId: dbUser._id,
                    recipeId: new Types.ObjectId(input.recipeId),
                    servings: input.servings,
                    notes: input.notes,
                    status: SessionStatus.IN_PROGRESS,
                    currentStepIndex: 0,
                    stepsProgress,
                    totalSteps: recipe.steps.length // Add this to track total steps
                });
                
                return session;
            } catch (error) {
                if (error instanceof ApplicationError) {
                    throw new GraphQLError(error.message, {
                        extensions: {
                            code: error.details?.code || 'SESSION_ERROR',
                            ...error.details
                        }
                    });
                }
                throw error;
            }
        },
        
        updateStepProgress: async (_: never,
            { input }: { 
                input: { 
                    sessionId: string;
                    stepIndex: number;
                    completed: boolean;
                }
            },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            const session = await validateSessionAccess(input.sessionId, dbUser._id);
            
            const recipe = await Recipe.findById(session.recipeId);
            if (!recipe) throw new ApplicationError('Recipe not found', 404);
            
            // Validate session is active
            if (session.status !== SessionStatus.IN_PROGRESS) {
                throw new ApplicationError(
                    'Cannot update progress on non-active session',
                    400
                );
            }
            
            // Validate step index
            if (input.stepIndex < 0 || input.stepIndex >= session.totalSteps) {
                throw new ApplicationError(
                    `Invalid step index. Must be between 0 and ${session.totalSteps - 1}`,
                    400
                );
            }
            
            // If marking a step as incomplete, mark all subsequent steps as incomplete
            if (!input.completed) {
                session.stepsProgress = session.stepsProgress.map(step => ({
                    ...step,
                    completed: step.stepIndex < input.stepIndex ? step.completed : false
                }));
                session.currentStepIndex = input.stepIndex;
            } else {
                // If marking complete, ensure all previous steps are complete
                const previousIncomplete = session.stepsProgress.some(step => 
                    step.stepIndex < input.stepIndex && !step.completed
                );
                
                if (previousIncomplete) {
                    throw new ApplicationError(
                        'Cannot complete this step before completing previous steps',
                        400
                    );
                }
        
                // Update the specific step
                const stepIndex = session.stepsProgress.findIndex(
                    step => step.stepIndex === input.stepIndex
                );
                if (stepIndex !== -1) {
                    session.stepsProgress[stepIndex].completed = true;
                }
        
                // Check if this was the last step and all steps are now complete
                const allStepsCompleted = session.stepsProgress.every(step => step.completed);
                if (allStepsCompleted) {
                    session.status = SessionStatus.COMPLETED;
                    session.completedAt = new Date();
                    session.completionSource = CompletionSource.COOK_MODE;
        
                    // Update recipe stats
                    await Recipe.findByIdAndUpdate(session.recipeId, {
                        $inc: { 'reviewStats.totalCookCount': 1 },
                        $set: { 'reviewStats.lastCooked': new Date() }
                    });

                              // Update badge progress
            await updateBudgetMasterProgress(dbUser._id, recipe);
                } else {
                    // Update current step index if not the last step
                    if (input.stepIndex === session.currentStepIndex) {
                        session.currentStepIndex = input.stepIndex + 1;
                    }
                }
            }
            
            await session.save();
            return session;
        },
        
        pauseCookingSession: async (_: never,
            { id }: { id: string },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            const session = await validateSessionAccess(id, dbUser._id);
            
            if (session.status !== SessionStatus.IN_PROGRESS) {
                throw new ApplicationError(
                    'Only active sessions can be paused',
                    400
                );
            }
            
            session.status = SessionStatus.PAUSED;
            await session.save();
            return session;
        },
        
        resumeCookingSession: async (_: never,
            { id }: { id: string },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            const session = await validateSessionAccess(id, dbUser._id);
            
            if (session.status !== SessionStatus.PAUSED) {
                throw new ApplicationError(
                    'Only paused sessions can be resumed',
                    400
                );
            }
            
            session.status = SessionStatus.IN_PROGRESS;
            await session.save();
            return session;
        },
        
        completeCookingSession: async (_: never,
            { 
                id, 
                source 
            }: { 
                id: string;
                source: CompletionSource;
            },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            const session = await validateSessionAccess(id, dbUser._id);
        
            // Check if session can be completed
            if (![SessionStatus.IN_PROGRESS, SessionStatus.PAUSED].includes(session.status)) {
                throw new ApplicationError(
                    'Only active or paused sessions can be completed',
                    400
                );
            }
        
            // Handle completion based on source
            if (source === CompletionSource.COOK_MODE) {
                // For cook mode, verify all steps are complete
                const incompleteSteps = session.stepsProgress.filter(step => !step.completed);
                if (incompleteSteps.length > 0) {
                    throw new ApplicationError(
                        `Cannot complete session: ${incompleteSteps.length} steps remaining`,
                        400
                    );
                }
            } else {
                // For other sources (MEAL_PLAN, MANUAL), auto-complete all steps
                session.stepsProgress = session.stepsProgress.map(step => ({
                    ...step,
                    completed: true
                }));
            }
        
            session.status = SessionStatus.COMPLETED;
            session.completionSource = source;
            session.completedAt = new Date();
        
            // Get recipe details for badge progress BEFORE saving session
            const recipe = await Recipe.findById(session.recipeId);
            if (!recipe) throw new ApplicationError('Recipe not found', 404);
        
            await session.save();
        
            // Update recipe stats
            await Recipe.findByIdAndUpdate(session.recipeId, {
                $inc: { 'reviewStats.totalCookCount': 1 },
                $set: { 'reviewStats.lastCooked': new Date() }
            });
        
            // Update badge progress AFTER everything else succeeded
            await updateBudgetMasterProgress(dbUser._id, recipe);
        
            return session;
        },
        
        abandonCookingSession: async (_: never,
            { 
                id, 
                reason 
            }: { 
                id: string;
                reason?: string;
            },
            context: Context
        ) => {
            const dbUser = await getAuthUser(context);
            const session = await validateSessionAccess(id, dbUser._id);
            
            if (![SessionStatus.IN_PROGRESS, SessionStatus.PAUSED].includes(session.status)) {
                throw new ApplicationError(
                    'Only active or paused sessions can be abandoned',
                    400
                );
            }
            
            session.status = SessionStatus.ABANDONED;
            session.abandonedReason = reason || 'Manually abandoned';
            await session.save();
            return session;
        }
    },
    
    // Field resolvers
    CookingSession: {
        recipe: async (parent: ICookingSession) => {
            return Recipe.findById(parent.recipeId);
        }
    }
};

