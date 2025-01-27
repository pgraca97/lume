// src/graphql/resolvers/user.ts
import { azureStorage } from "../../config/azureStorage";
import { OnboardingStep } from "../../models/enums/UserEnums";
import { IUser, User, WelcomeStep } from "../../models/User";
import { Context } from "../../types/context";
import { requireAuth, requireAdmin } from "../../utils/auth";
import { ApplicationError } from "../../utils/errors";

import {
  DietaryProfile,
  TimePreference,
  CookingGoal,
  MeasurementSystem,
  PortionSize,
  BudgetLevel,
  MealPlanningFrequency,
} from "../../models/enums/UserEnums";
import { Badge, BadgeStatus, UserBadgeProgress } from "../../models/Badge";

interface DefaultAvatarInput {
  type: "DEFAULT";
  avatarId: DefaultAvatar;
}

interface UploadedImageInput {
  type: "UPLOAD";
  blobPath: string;
}

interface ProfileImageInput {
  defaultAvatar?: DefaultAvatarInput;
  uploadedImage?: UploadedImageInput;
}

interface ProfileStepInput {
  username: string;
  bio?: string;
  profileImage?: ProfileImageInput;
}

interface ExperienceStepInput {
  experienceLevel: number;
  cookingGoals: CookingGoal[];
  timePreference: TimePreference;
}

interface DietaryStepInput {
  dietaryProfile: DietaryProfile;
  dietaryRestrictions: string[];
  allergies: string[];
}

interface PreferencesStepInput {
  measurementSystem: MeasurementSystem;
  portionSize: PortionSize;
  budgetLevel: BudgetLevel;
  mealPlanningFrequency: MealPlanningFrequency;
}

interface UpdateSettingsInput {
  notifications?: NotificationSettingsInput;
  privacy?: PrivacySettingsInput;
  appearance?: AppearanceSettingsInput;
}

interface NotificationSettingsInput {
  mealPlanReminders?: boolean;
  weeklyNewsletter?: boolean;
  recipeComments?: boolean;
  specialOffers?: boolean;
  recipeSuggestions?: boolean;
}

interface PrivacySettingsInput {
  profileVisibility?: "PUBLIC" | "PRIVATE" | "FRIENDS_ONLY";
  showMealPlans?: boolean;
  showShoppingLists?: boolean;
}

interface AppearanceSettingsInput {
  theme?: "LIGHT" | "DARK" | "SYSTEM";
  fontSize?: "SMALL" | "MEDIUM" | "LARGE";
}

interface UpdatePreferencesInput {
  dietaryProfile?: DietaryProfile;
  dietaryRestrictions?: string[];
  allergies?: string[];
  dislikedIngredients?: string[];
  measurementSystem?: MeasurementSystem;
  portionSize?: PortionSize;
  experienceLevel?: number;
  cookingGoals?: CookingGoal[];
  timePreference?: TimePreference;
  budgetLevel?: BudgetLevel;
  mealPlanningFrequency?: MealPlanningFrequency;
  favoriteCuisines?: string[];
  maxRecipeTime?: number;
  preferredCookingMethods?: string[];
}

enum DefaultAvatar {
  BAKER = "baker",
  GOURMAND = "gourmand",
  CASUAL_COOK = "casual-cook",
  HOME_BAKER = "home-baker",
  CLASSIC_CHEF = "classic-chef",
  WHIMSICAL_COOK = "whimsical-cook",
  PERFECTIONIST_CHEF = "perfectionist-chef",
}

function extractRequiredCount(requirement: string): number {
  const match = requirement.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

export const userResolvers = {
  Query: {
    me: async (_: never, __: never, context: Context) => {
      const user = requireAuth(context);
      console.log("me", user);
      const dbUser = await User.findOne({ firebaseUid: user.uid });
      if (!dbUser) {
        throw new ApplicationError("User not found", 404);
      }
      console.log("me2", dbUser);
      return dbUser; // Returns full user data
    },

    user: async (_: never, { id }: { id: string }) => {
      const user = await User.findById(id);
      if (!user) {
        throw new ApplicationError("User not found", 404);
      }

      // Check privacy settings for other users
      if (user.settings.privacy.profileVisibility === "PRIVATE") {
        throw new ApplicationError("This profile is private", 403);
      }

      // Return filtered public data
      const publicUser = {
        id: user.id,
        profile: {
          username: user.profile.username,
          bio: user.profile.bio,
          profileImage: user.profile.profileImage,
        },
      };

      return publicUser;
    },
  },

  UserProfile: {
    profileImageUrl: (parent: { profileImage?: string }) => {
      if (!parent.profileImage) return null;
      return azureStorage.getSecureUrl(parent.profileImage);
    },
  },

  Mutation: {
    createUser: async (
      _: never,
      { input }: { input: { firebaseUid: string; email: string } }
    ) => {
      console.log("createUser", input);
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ firebaseUid: input.firebaseUid }, { email: input.email }],
      });

      if (existingUser) {
        throw new ApplicationError("User already exists", 409);
      }

      // Create new user with default values
      const user = await User.create({
        firebaseUid: input.firebaseUid,
        email: input.email,
        isEmailVerified: false,
        profile: {
          username: undefined, // Empty username
          bio: undefined, // Empty bio
          profileImage: null, // No profile image
        },
        preferences: {
          dietaryProfile: "OMNIVORE",
          dietaryRestrictions: [],
          allergies: [],
          dislikedIngredients: [],
          measurementSystem: "METRIC",
          portionSize: "MEDIUM",
          experienceLevel: 1,
          cookingGoals: [],
          timePreference: "MODERATE_TIME",
          budgetLevel: "MODERATE",
          mealPlanningFrequency: "NONE",
          favoriteCuisines: [],
          preferredCookingMethods: [],
        },
        settings: {
          notifications: {
            mealPlanReminders: true,
            weeklyNewsletter: true,
            recipeComments: true,
            specialOffers: true,
            recipeSuggestions: true,
          },
          privacy: {
            profileVisibility: "PUBLIC",
            showMealPlans: true,
            showShoppingLists: true,
          },
          appearance: {
            theme: "SYSTEM",
            fontSize: "MEDIUM",
          },
        },
        onboarding: {
          isCompleted: false,
          completedSteps: [],
        },
        welcomeFlow: {
          isCompleted: false,
          completedSteps: [],
          currentStep: WelcomeStep.GREETINGS,
        },
        loginCount: 0,
      });

      // Initialize badge progress for the new user
      const badges = await Badge.find({ isActive: true });
      await UserBadgeProgress.create(
        badges.map((badge) => ({
          userId: user._id,
          badgeId: badge._id,
          status: BadgeStatus.VISIBLE,
          progress: 0,
          milestones: badge.requirements.map((req) => ({
            description: req,
            requiredCount: extractRequiredCount(req),
            currentCount: 0,
            completed: false,
          })),
        }))
      );

      return user;
    },
  },

  getProfileImageUploadUrl: async (
    _: never,
    {
      input,
    }: { input: { filename: string; contentType: string; size: number } },
    context: Context
  ) => {
    const authUser = requireAuth(context);

    // Validate file metadata
    if (!input.filename || !input.contentType || !input.size) {
      throw new ApplicationError("Missing required file metadata", 400);
    }

    // Validate file constraints
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedTypes.includes(input.contentType)) {
      throw new ApplicationError(
        "Invalid file type. Only JPEG, PNG, and WebP allowed.",
        400
      );
    }

    if (input.size > maxSize) {
      throw new ApplicationError("File too large. Maximum size is 5MB.", 400);
    }

    // Generate Azure storage path and URL
    const blobPath = azureStorage.generateStoragePath(
      input.filename,
      "profileImages",
      authUser.uid
    );

    return {
      uploadUrl: azureStorage.getSecureUrl(blobPath),
      blobPath,
    };
  },

  completeProfileStep: async (
    _: never,
    { input }: { input: ProfileStepInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    validateOnboardingAccess(user);

    // Username validation
    if (!input.username || input.username.trim().length < 3) {
      throw new ApplicationError(
        "Username is required and must be at least 3 characters",
        400
      );
    }

    if (input.username.length > 30) {
      throw new ApplicationError("Username cannot exceed 30 characters", 400);
    }

    // Username uniqueness check
    const existingUser = await User.findOne({
      "profile.username": input.username.toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new ApplicationError("Username already taken", 400);
    }

    // Handle profile image
    const profileImagePath = await handleProfileImage(input.profileImage);

    // Update user profile
    user.profile = {
      username: input.username.toLowerCase(), // Store username in lowercase
      bio: input.bio?.trim() || "",
      ...(profileImagePath && { profileImage: profileImagePath }), // Only include if defined
    };

    // Update onboarding status
    await updateOnboardingStatus(user, OnboardingStep.PROFILE);
    await user.save();

    return user.onboarding;
  },

  completeExperienceStep: async (
    _: never,
    { input }: { input: ExperienceStepInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    validateOnboardingAccess(user);

    // Update preferences
    user.preferences.experienceLevel = input.experienceLevel;
    user.preferences.cookingGoals = input.cookingGoals;
    user.preferences.timePreference = input.timePreference;

    // Update onboarding status
    await updateOnboardingStatus(user, OnboardingStep.EXPERIENCE);

    await user.save();
    return user.onboarding;
  },

  completeDietaryStep: async (
    _: never,
    { input }: { input: DietaryStepInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    validateOnboardingAccess(user);

    // Update preferences
    user.preferences.dietaryProfile = input.dietaryProfile;
    user.preferences.dietaryRestrictions = input.dietaryRestrictions;
    user.preferences.allergies = input.allergies;

    // Update onboarding status
    await updateOnboardingStatus(user, OnboardingStep.DIETARY);

    await user.save();
    return user.onboarding;
  },

  completePreferencesStep: async (
    _: never,
    { input }: { input: PreferencesStepInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    validateOnboardingAccess(user);

    // Update preferences
    user.preferences.measurementSystem = input.measurementSystem;
    user.preferences.portionSize = input.portionSize;
    user.preferences.budgetLevel = input.budgetLevel;
    user.preferences.mealPlanningFrequency = input.mealPlanningFrequency;

    // Update onboarding status
    await updateOnboardingStatus(user, OnboardingStep.PREFERENCES);

    await user.save();
    return user.onboarding;
  },

  completeWelcomeStep: async (_: never, __: never, context: Context) => {
    const dbUser = await getAuthenticatedUser(context);

    // Already completed
    if (dbUser.welcomeFlow.isCompleted) {
      return dbUser.welcomeFlow;
    }

    const currentStep = dbUser.welcomeFlow.currentStep || WelcomeStep.GREETINGS;
    const completedSteps = new Set(dbUser.welcomeFlow.completedSteps);
    completedSteps.add(currentStep);

    // Determine next step
    let nextStep: WelcomeStep | null = null;
    let isCompleted = false;

    switch (currentStep) {
      case WelcomeStep.GREETINGS:
        nextStep = WelcomeStep.SOUSCHEF;
        break;
      case WelcomeStep.SOUSCHEF:
        nextStep = WelcomeStep.DINNERS;
        break;
      case WelcomeStep.DINNERS:
        isCompleted = true;
        break;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      dbUser._id,
      {
        welcomeFlow: {
          isCompleted,
          currentStep: nextStep,
          completedSteps: Array.from(completedSteps),
          ...(isCompleted && { completedAt: new Date() }),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new ApplicationError("Failed to update welcome flow", 500);
    }

    return updatedUser.welcomeFlow;
  },

  completeWelcomeFlow: async (_: never, __: never, context: Context) => {
    const dbUser = await getAuthenticatedUser(context);

    const updatedUser = await User.findByIdAndUpdate(
      dbUser._id,
      {
        welcomeFlow: {
          isCompleted: true,
          completedSteps: Object.values(WelcomeStep),
          completedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new ApplicationError("Failed to complete welcome flow", 500);
    }

    return updatedUser.welcomeFlow;
  },

  updateProfile: async (
    _: never,
    { input }: { input: ProfileStepInput },
    context: Context
  ) => {
    // Autenticação e validação do utilizador
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("Utilizador não encontrado", 404);

    // Validação do username
    if (input.username) {
      if (input.username.trim().length < 3) {
        throw new ApplicationError(
          "O nome de utilizador deve ter pelo menos 3 caracteres",
          400
        );
      }

      const existingUser = await User.findOne({
        "profile.username": input.username.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        throw new ApplicationError("Nome de utilizador já existe", 400);
      }
    }

    // Atualização do perfil
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        profile: {
          ...user.profile,
          username: input.username.toLowerCase(),
          bio: input.bio?.trim() || "",
          ...(input.profileImage && { profileImage: input.profileImage }),
        },
      },
      {
        new: true,
        runValidators: true,
        select: "id email profile settings",
      }
    );

    if (!updatedUser) {
      throw new ApplicationError("Falha na atualização do perfil", 500);
    }

    return updatedUser;
  },

  updateSettings: async (
    _: never,
    { input }: { input: UpdateSettingsInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    // Create settings update maintaining the full structure
    const updatedSettings = {
      notifications: {
        ...user.settings.notifications,
        ...(input.notifications || {}),
      },
      privacy: {
        ...user.settings.privacy,
        ...(input.privacy || {}),
      },
      appearance: {
        ...user.settings.appearance,
        ...(input.appearance || {}),
      },
    };

    // Update settings while maintaining the complete structure
    user.settings = updatedSettings;

    await user.save();
    return user;
  },

  updatePreferences: async (
    _: never,
    { input }: { input: UpdatePreferencesInput },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    // Filter out undefined properties from the input
    const inputWithoutUndefined = Object.fromEntries(
      Object.entries(input).filter(([_, v]) => v !== undefined)
    );

    // Update preferences while maintaining the complete structure
    user.preferences = { ...user.preferences, ...inputWithoutUndefined };

    await user.save();
    return user;
  },

  syncEmailUpdate: async (
    _: never,
    { email }: { email: string },
    context: Context
  ) => {
    const authUser = requireAuth(context);
    const user = await User.findOne({ firebaseUid: authUser.uid });
    if (!user) throw new ApplicationError("User not found", 404);

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      throw new ApplicationError("Invalid email format", 400);
    }

    // Check if email is already taken
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new ApplicationError("Email already in use", 400);
    }

    // Update email
    user.email = email.toLowerCase();
    user.isEmailVerified = false; // Reset verification status

    await user.save();
    return user;
  },
};

// Helper function to update onboarding status

async function updateOnboardingStatus(
  user: any,
  completedStep: OnboardingStep
) {
  if (!user.onboarding.completedSteps.includes(completedStep)) {
    user.onboarding.completedSteps.push(completedStep);
    user.onboarding.lastCompletedStep = completedStep;
  }

  // Check if all steps are completed
  const allStepsCompleted = Object.values(OnboardingStep).every((step) =>
    user.onboarding.completedSteps.includes(step)
  );

  if (allStepsCompleted && !user.onboarding.isCompleted) {
    user.onboarding.isCompleted = true;
    user.onboarding.completedAt = new Date();
  }
}

const validateOnboardingAccess = (user: IUser) => {
  if (user.onboarding.isCompleted) {
    throw new ApplicationError(
      "Onboarding already completed. Please use update mutations instead.",
      400
    );
  }
};

// Update profile image handling in both mutations
const handleProfileImage = async (
  profileImage: ProfileImageInput | undefined | null,
  currentImagePath?: string
): Promise<string | undefined> => {
  if (profileImage === null) {
    // Delete old uploaded image if exists
    if (currentImagePath?.startsWith("users/")) {
      try {
        await azureStorage.deleteBlob(currentImagePath);
      } catch (error) {
        console.error("Error deleting old profile image:", error);
      }
    }
    return undefined;
  }

  if (!profileImage) return currentImagePath;

  // Handle default avatar
  if (profileImage.defaultAvatar) {
    if (
      !Object.values(DefaultAvatar).includes(
        profileImage.defaultAvatar.avatarId
      )
    ) {
      throw new ApplicationError("Invalid default avatar", 400);
    }
    return `avatars/${profileImage.defaultAvatar.avatarId}.svg`;
  }

  // Handle uploaded image
  if (profileImage.uploadedImage) {
    // Delete old uploaded image if exists
    if (currentImagePath?.startsWith("users/")) {
      try {
        await azureStorage.deleteBlob(currentImagePath);
      } catch (error) {
        console.error("Error deleting old profile image:", error);
      }
    }
    return profileImage.uploadedImage.blobPath;
  }

  return currentImagePath;
};

const getAuthenticatedUser = async (context: Context) => {
  const user = requireAuth(context);
  const dbUser = await User.findOne({ firebaseUid: user.uid });
  if (!dbUser) throw new ApplicationError("User not found", 404);
  return dbUser;
};
