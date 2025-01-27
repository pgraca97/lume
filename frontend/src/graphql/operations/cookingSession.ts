// src/graphql/operations/cookingSession.ts
import { gql } from "@apollo/client";

export const START_COOKING_SESSION = gql`
  mutation StartCookingSession($input: StartCookingSessionInput!) {
    startCookingSession(input: $input) {
      id
      status
      currentStepIndex
      totalSteps
      stepsProgress {
        stepIndex
        completed
      }
    }
  }
`;

export const UPDATE_STEP_PROGRESS = gql`
  mutation UpdateStepProgress($input: UpdateStepProgressInput!) {
    updateStepProgress(input: $input) {
      id
      status
      currentStepIndex
      stepsProgress {
        stepIndex
        completed
      }
    }
  }
`;

export const COMPLETE_COOKING_SESSION = gql`
  mutation CompleteCookingSession($id: ID!, $source: CompletionSource!) {
    completeCookingSession(id: $id, source: $source) {
      id
      status
      completedAt
      completionSource
    }
  }
`;


export const GET_INCOMPLETE_SESSIONS = gql`
  query GetIncompleteSessions {
    incompleteCookingSessions {
      id
      recipeId
      status
    }
  }
`;
