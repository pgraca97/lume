// src/graphql/operations/user.ts
import { gql } from "@apollo/client";
import { USER_FIELDS } from "../schema/user";

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      email
      profile {
        username
        bio
        profileImage
        profileImageUrl
      }
    }
  }
`;

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    fetchUserByEmail(email: $email) {
      id
      email
      profile {
        username
        bio
        profileImage
        profileImageUrl
      }
    }
  }
`;

export const GET_USER_ID_BY_EMAIL = gql`
  query GetUserIdByEmail($email: String!) {
    getUserByEmail(email: $email) {
      id
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: ProfileStepInput!) {
    updateProfile(input: $input) {
      id
      email
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
    }
  }
`;

/* export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences($diet: [String!], $allergies: [String!]) {
    updateUserPreferences(diet: $diet, allergies: $allergies) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`; */
