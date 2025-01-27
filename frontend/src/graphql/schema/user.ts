import { gql } from '@apollo/client';

export const USER_FIELDS = gql `
  fragment UserFields on User {
    id
    firebaseUid
    email
    preferences {
      dietaryProfile
      dietaryRestrictions
      allergies
      dislikedIngredients
      measurementSystem
      portionSize
      experienceLevel
      cookingGoals
      timePreference
      budgetLevel
      mealPlanningFrequency
      favoriteCuisines
      maxRecipeTime
      preferredCookingMethods
    }
    profile {
      username
      bio
      profileImage
      profileImageUrl
    }
    settings {
      notifications {
        mealPlanReminders
        weeklyNewsletter
        recipeComments
        specialOffers
        recipeSuggestions
      }
      privacy {
        profileVisibility
        showMealPlans
        showShoppingLists
      }
      appearance {
        theme
        fontSize
      }
    }
    onboarding {
      isCompleted
      completedSteps
      lastCompletedStep
      completedAt
    }
    welcomeFlow {
      isCompleted
      currentStep
      completedSteps
    }
    createdAt
    updatedAt
  }`
;