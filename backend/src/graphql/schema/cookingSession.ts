// src/graphql/schema/cookingSession.ts
export const cookingSessionTypeDefs = `#graphql
"""
Status of a cooking session
"""
enum SessionStatus {
    IN_PROGRESS
    PAUSED
    COMPLETED
    ABANDONED
}

"""
Source of session completion
"""
enum CompletionSource {
    COOK_MODE
    MEAL_PLAN
    MANUAL
}

"""
Progress tracking for a single recipe step
"""
type StepProgress {
    stepIndex: Int!
    completed: Boolean!
}

"""
Represents a single cooking session
"""
type CookingSession {
    id: ID!
    recipe: Recipe!
    status: SessionStatus!
    currentStepIndex: Int!
    totalSteps: Int!
    stepsProgress: [StepProgress!]!
    servings: Int!
    notes: String
    startedAt: DateTime!
    lastActiveAt: DateTime!
    completedAt: DateTime
    completionSource: CompletionSource
    abandonedReason: String
}

input StartCookingSessionInput {
    recipeId: ID!
    servings: Int!
    notes: String
}

input UpdateStepProgressInput {
    sessionId: ID!
    stepIndex: Int!
    completed: Boolean!
}

extend type Query {
    """
    Get all incomplete cooking sessions for current user
    """
    incompleteCookingSessions: [CookingSession!]!
    
    """
    Get specific cooking session by ID
    """
    cookingSession(id: ID!): CookingSession
    
    """
    Get cooking history for a specific recipe
    """
    recipeCookingHistory(recipeId: ID!): [CookingSession!]!
}

extend type Mutation {
    """
    Start a new cooking session
    """
    startCookingSession(input: StartCookingSessionInput!): CookingSession!
    
    """
    Update progress on a specific step
    """
    updateStepProgress(input: UpdateStepProgressInput!): CookingSession!
    
    """
    Pause an active cooking session
    """
    pauseCookingSession(id: ID!): CookingSession!
    
    """
    Resume a paused cooking session
    """
    resumeCookingSession(id: ID!): CookingSession!
    
    """
    Complete a cooking session
    """
    completeCookingSession(
        id: ID!
        source: CompletionSource!
    ): CookingSession!
    
    """
    Abandon a cooking session
    """
    abandonCookingSession(
        id: ID!
        reason: String
    ): CookingSession!
}
`;