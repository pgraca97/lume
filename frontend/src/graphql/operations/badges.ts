import { gql } from "@apollo/client";

export const GET_UNCONQUERED_BADGES = gql`
  query UnconqueredBadges($userId: ID, $sort: UnconqueredBadgeSortOption) {
    unconqueredBadges(userId: $userId, sort: $sort) {
      badges {
        id
        key
        name
        description
        category
        rarity
        assetUrl
        requirements
        xpReward
        order
        isActive
        userProgress {
          progress
          milestones {
            completed
            currentCount
            description
            requiredCount
          }
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_CONQUERED_BADGES = gql`
  query ConqueredBadges($userId: ID) {
    conqueredBadges(userId: $userId) {
      badges {
        id
        key
        name
        description
        category
        rarity
        assetUrl
        requirements
        xpReward
        order
        isActive
        userProgress {
          status
          progress
          milestones {
            description
            requiredCount
            currentCount
            completed
          }
          achievedAt
          lastUpdated
        }
        createdAt
        updatedAt
      }
    }
  }
`;
