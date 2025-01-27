import { gql } from "@apollo/client";

export const GET_UPLOAD_URL = gql`
  mutation GetCookSnapUploadUrl($input: CookSnapUploadInput!) {
    getCookSnapUploadUrl(input: $input) {
      uploadUrl
      blobPath
    }
  }
`;

export const ADD_REVIEW = gql`
  mutation AddReview(
    $recipeId: ID!
    $rating: Float!
    $comment: String
    $cookSnaps: [String!]
  ) {
    addReview(
      recipeId: $recipeId
      rating: $rating
      comment: $comment
      cookSnaps: $cookSnaps
    ) {
      id
      recipeId
      userId
      rating
      comment
      firstCooked
      lastCooked
      cookCount
      createdAt
      updatedAt
      cookSnaps
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation UpdateReview($reviewId: ID!, $rating: Float, $comment: String) {
    updateReview(reviewId: $reviewId, rating: $rating, comment: $comment) {
      rating
      comment
      firstCooked
      lastCooked
      cookCount
      createdAt
      updatedAt
      cookSnaps
    }
  }
`;

export const UPDATE_REVIEW_SNAPS = gql`
  mutation Mutation($input: updateReviewImagesInput!) {
    updateReviewImages(input: $input) {
      rating
      comment
      firstCooked
      lastCooked
      cookCount
      createdAt
      updatedAt
      cookSnaps
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation Mutation($reviewId: ID!) {
    deleteReview(reviewId: $reviewId) {
      success
      message
    }
  }
`;
