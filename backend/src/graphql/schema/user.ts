// src/graphql/schema/user.ts

const userPreferencesFields = `
  dietaryProfile: DietaryProfile
  dietaryRestrictions: [String!]
  allergies: [String!]
  dislikedIngredients: [String!]
  measurementSystem: MeasurementSystem
  portionSize: PortionSize
  experienceLevel: Int
  cookingGoals: [CookingGoal!]
  timePreference: TimePreference
  budgetLevel: BudgetLevel
  mealPlanningFrequency: MealPlanningFrequency
  favoriteCuisines: [String!]
  maxRecipeTime: Int
  preferredCookingMethods: [String!]
`;

export const typeDefs = `#graphql
"""
Core enums for user preferences
"""
enum DietaryProfile {
  OMNIVORE
  VEGETARIAN
  VEGAN
  PESCATARIAN
  FLEXITARIAN
}

enum MeasurementSystem {
  METRIC
  IMPERIAL
  HYBRID
}

enum PortionSize {
  SMALL
  MEDIUM
  LARGE
}

enum TimePreference {
  QUICK_MEALS
  MODERATE_TIME
  FLEXIBLE
}

enum BudgetLevel {
  BUDGET_FRIENDLY
  MODERATE
  PREMIUM
}

enum MealPlanningFrequency {
  DAILY
  WEEKLY
  MONTHLY
  FLEXIBLE
  NONE
}

enum CookingGoal {
  LEARN_BASICS
  MEAL_PREP
  EAT_HEALTHY
  SAVE_MONEY
  SAVE_TIME
  IMPROVE_SKILLS
  EXPLORE_CUISINES
}

enum ProfileVisibility {
  PUBLIC
  PRIVATE
  FRIENDS_ONLY
}

enum Theme {
  LIGHT
  DARK
  SYSTEM
}

enum FontSize {
  SMALL
  MEDIUM
  LARGE
}

enum ProfileImageType {
  UPLOAD
  DEFAULT
}

enum WelcomeStep {
        GREETINGS
        FEATURES
        PERSONALIZATION
    }


    type WelcomeFlow {
        isCompleted: Boolean!
        currentStep: WelcomeStep
        completedSteps: [WelcomeStep!]!
        completedAt: DateTime
    }

"""
User profile information
"""
type UserProfile {
  username: String
  bio: String
  profileImage: String
  profileImageUrl: String
}

"""
User preferences
"""
type UserPreferences {
  ${userPreferencesFields}
}

input UpdatePreferencesInput {
  ${userPreferencesFields}
}


"""
Settings types
"""
type UserSettings {
  notifications: NotificationSettings!
  privacy: PrivacySettings!
  appearance: AppearanceSettings!
}

type NotificationSettings {
  mealPlanReminders: Boolean!
  weeklyNewsletter: Boolean!
  recipeComments: Boolean!
  specialOffers: Boolean!
  recipeSuggestions: Boolean!
}

type PrivacySettings {
  profileVisibility: ProfileVisibility!
  showMealPlans: Boolean!
  showShoppingLists: Boolean!
}

type AppearanceSettings {
  theme: Theme!
  fontSize: FontSize!
}

"""
Onboarding status
"""
type UserOnboarding {
  isCompleted: Boolean!
  completedSteps: [String!]!
  lastCompletedStep: String
  completedAt: DateTime
}

"""
Main User type
"""
type User {
  id: ID!
  firebaseUid: String!
  email: String!
  isEmailVerified: Boolean!
  profile: UserProfile!
  preferences: UserPreferences!
  settings: UserSettings!
  onboarding: UserOnboarding!
  welcomeFlow: WelcomeFlow!
  lastLoginAt: DateTime
  loginCount: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

"""
Public user profile information
"""
type PublicUser {
  id: ID!
  email: String
  profile: UserProfile!
  lastLoginAt: DateTime
  badgeStats: BadgeStats
}

"""
Input types for mutations
"""
input CreateUserInput {
  firebaseUid: String!
  email: String!
}

input DefaultAvatarInput {
  type: ProfileImageType!  # Will always be DEFAULT
  avatarId: String!       # Will be one of the DefaultAvatar
}

input UploadedImageInput {
  type: ProfileImageType!  # Will always be UPLOAD
  blobPath: String!       # Path to Azure
}

input ProfileStepInput {
  username: String
  bio: String
  profileImage: ProfileImageInput
}

input ProfileImageInput {
  defaultAvatar: DefaultAvatarInput
  uploadedImage: UploadedImageInput
}


input ExperienceStepInput {
  experienceLevel: Int!
  cookingGoals: [CookingGoal!]!
  timePreference: TimePreference!
}

input DietaryStepInput {
  dietaryProfile: DietaryProfile!
  dietaryRestrictions: [String!]!
  allergies: [String!]!
}

input PreferencesStepInput {
  measurementSystem: MeasurementSystem!
  portionSize: PortionSize!
  budgetLevel: BudgetLevel!
  mealPlanningFrequency: MealPlanningFrequency!
}

input UpdateSettingsInput {
  notifications: NotificationSettingsInput
  privacy: PrivacySettingsInput
  appearance: AppearanceSettingsInput
}

input NotificationSettingsInput {
  mealPlanReminders: Boolean
  weeklyNewsletter: Boolean
  recipeComments: Boolean
  specialOffers: Boolean
  recipeSuggestions: Boolean
}

input PrivacySettingsInput {
  profileVisibility: ProfileVisibility
  showMealPlans: Boolean
  showShoppingLists: Boolean
}

input AppearanceSettingsInput {
  theme: Theme
  fontSize: FontSize
}

input ImageUploadInput {
  filename: String!
  contentType: String!
  size: Int!
}

type ImageUploadPayload {
  uploadUrl: String!
  blobPath: String!
}


"""
Queries
"""
type Query {
  """Get user by ID (public profile or full profile if self)"""
  user(id: ID!): PublicUser!
  
  """Get currently authenticated user's full profile"""
  me: User!

   """Get multiple users by their IDs"""
  getUsersByIds(ids: [ID!]!): [User!]

   """Get user by email"""
  fetchUserByEmail(email: String!): User!
}

"""
Mutations
"""
type Mutation {
  """Create new user account"""
  createUser(input: CreateUserInput!): User!
  
  """Update user settings"""
  updateSettings(input: UpdateSettingsInput!): User!
  
  """Onboarding steps"""
  completeProfileStep(input: ProfileStepInput!): UserOnboarding!
  completeExperienceStep(input: ExperienceStepInput!): UserOnboarding!
  completeDietaryStep(input: DietaryStepInput!): UserOnboarding!
  completePreferencesStep(input: PreferencesStepInput!): UserOnboarding!

        """
        Complete current welcome step and proceed to next
        Returns null for currentStep when flow is completed
        """
        completeWelcomeStep: WelcomeFlow!

        """
        Mark entire welcome flow as completed
        Useful for skipping or finishing the flow
        """
        completeWelcomeFlow: WelcomeFlow!

  getProfileImageUploadUrl(input: ImageUploadInput!): ImageUploadPayload!

  updateProfile(input: ProfileStepInput!): User!

  updateSettings(input: UpdateSettingsInput!): User!

  updatePreferences(input: UpdatePreferencesInput!): User!

  syncEmailUpdate(email: String!): User!

}

scalar DateTime
`;
