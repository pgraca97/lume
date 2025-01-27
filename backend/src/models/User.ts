// src\models\User.ts
import mongoose, { Types, Document } from 'mongoose';
import { DifficultyLevel } from './enums/RecipeEnums';
import { 
  MeasurementSystem, 
  PortionSize, 
  CookingGoal, 
  TimePreference, 
  BudgetLevel, 
  MealPlanningFrequency, 
  DietaryProfile,
  DIETARY_RESTRICTIONS,
  COMMON_ALLERGENS
} from './enums/UserEnums';

export interface IUserProfile {
  username?: string;
  bio?: string;
  profileImage?: string;
}

export enum WelcomeStep {
  GREETINGS = 'GREETINGS',      
  SOUSCHEF = 'SOUSCHEF',          
  DINNERS = 'DINNERS'  
}

export interface IUserPreferences {
  // Dietary preferences
  dietaryProfile: DietaryProfile;
  dietaryRestrictions: string[]; // From DIETARY_RESTRICTIONS
  allergies: string[]; // From COMMON_ALLERGENS
  dislikedIngredients: string[]; // References to Ingredient IDs

  // Cooking preferences
  measurementSystem: MeasurementSystem;
  portionSize: PortionSize;
  experienceLevel: DifficultyLevel;

  // Goals and constraints
  cookingGoals: CookingGoal[];
  timePreference: TimePreference;
  budgetLevel: BudgetLevel;
  mealPlanningFrequency: MealPlanningFrequency;

  // Other preferences
  favoriteCuisines: string[]; // e.g., ["Italian", "Japanese"]
  maxRecipeTime?: number;     // Maximum recipe time in minutes
  preferredCookingMethods: string[]; // e.g., ["Baking", "Grilling"]
}

export interface IUserOnboarding {
  isCompleted: boolean;
  completedSteps: string[];
  lastCompletedStep?: string;
  completedAt?: Date;
}

export interface IWelcomeFlow {
  isCompleted: boolean;
  currentStep?: WelcomeStep;
  completedSteps: WelcomeStep[];
  completedAt?: Date;
}

export interface IUserSettings {
  notifications: {
    mealPlanReminders: boolean;
    weeklyNewsletter: boolean;
    recipeComments: boolean;
    specialOffers: boolean;
    recipeSuggestions: boolean;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showMealPlans: boolean;
    showShoppingLists: boolean;
  };
  appearance: {
    theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    fontSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  };
}

export interface IUser extends Document {
  // Authenticated user data
  _id: Types.ObjectId;
  firebaseUid: string;
  email: string;
  isEmailVerified: boolean;

  // Profile information
  profile: IUserProfile;

  // Preferences and settings
  preferences: IUserPreferences;
  settings: IUserSettings;

  // Onboarding status
  onboarding: IUserOnboarding;

  welcomeFlow: IWelcomeFlow;

  // Activity tracking
  lastLoginAt: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  // Authenticated user data
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Profile information
  profile: {
    username: {
      type: String,
      unique: true,       // Keep unique constraint
      sparse: true,       // Allow null/undefined values
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profileImage: String
  },

  // Preferences
  preferences: {
    dietaryProfile: {
      type: String,
      enum: Object.values(DietaryProfile),
      required: true,
      default: DietaryProfile.OMNIVORE
    },
    dietaryRestrictions: [{
      type: String,
      enum: DIETARY_RESTRICTIONS
    }],
    allergies: [{
      type: String,
      enum: [...COMMON_ALLERGENS, 'OTHER'],  // Allow common ones + OTHER
      required: true
    }],
    dislikedIngredients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient'
    }],
    experienceLevel: {
      type: String,
      enum: Object.values(DifficultyLevel),
      required: true,
      default: DifficultyLevel.FIRST_APRON
    },
    measurementSystem: {
      type: String,
      enum: Object.values(MeasurementSystem),
      required: true,
      default: MeasurementSystem.METRIC
    },
    portionSize: {
      type: String,
      enum: Object.values(PortionSize),
      required: true,
      default: PortionSize.MEDIUM
    },
    cookingGoals: [{
      type: String,
      enum: Object.values(CookingGoal)
    }],
    timePreference: {
      type: String,
      enum: Object.values(TimePreference),
      required: true,
      default: TimePreference.MODERATE_TIME
    },
    budgetLevel: {
      type: String,
      enum: Object.values(BudgetLevel),
      required: true,
      default: BudgetLevel.MODERATE
    },
    mealPlanningFrequency: {
      type: String,
      enum: Object.values(MealPlanningFrequency),
      required: true,
      default: MealPlanningFrequency.NONE
    },
    favoriteCuisines: [String],
    maxRecipeTime: {
      type: Number,
      min: 1,
      max: 360 // 6 hours
    },
    preferredCookingMethods: [String]
  },

  // Settings
  settings: {
    notifications: {
      mealPlanReminders: {
        type: Boolean,
        default: true
      },
      weeklyNewsletter: {
        type: Boolean,
        default: true
      },
      recipeComments: {
        type: Boolean,
        default: true
      },
      specialOffers: {
        type: Boolean,
        default: true
      },
      recipeSuggestions: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'],
        default: 'PUBLIC'
      },
      showMealPlans: {
        type: Boolean,
        default: true
      },
      showShoppingLists: {
        type: Boolean,
        default: true
      }
    },
    appearance: {
      theme: {
        type: String,
        enum: ['LIGHT', 'DARK', 'SYSTEM'],
        default: 'SYSTEM'
      },
      fontSize: {
        type: String,
        enum: ['SMALL', 'MEDIUM', 'LARGE'],
        default: 'MEDIUM'
      }
    }
  },

  // Onboarding status
  onboarding: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedSteps: [String],
    lastCompletedStep: String,
    completedAt: Date
  },

  welcomeFlow: {
    isCompleted: {
        type: Boolean,
        default: false
    },
    currentStep: {
        type: String,
        enum: Object.values(WelcomeStep),
        default: WelcomeStep.GREETINGS
    },
    completedSteps: [{
        type: String,
        enum: Object.values(WelcomeStep)
    }],
    completedAt: Date
},

  // Activity tracking
  lastLoginAt: Date,
  loginCount: {
    type: Number,
    default: 0
  },

}, {
  timestamps: true
});

export const User = mongoose.model<IUser>("User", userSchema);
