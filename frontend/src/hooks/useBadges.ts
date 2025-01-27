import { useQuery } from "@apollo/client";
import {
  GET_CONQUERED_BADGES,
  GET_UNCONQUERED_BADGES,
} from "../graphql/operations/badges";

export const useBadges = (userId) => {
  // Fetch unconquered badges using the query and variables
  const {
    data: unconqueredBadgesData,
    loading: unconqueredBadgesLoading,
    error: unconqueredBadgesError,
    refetch: unconqueredBadgesRefetch,
  } = useQuery(GET_UNCONQUERED_BADGES, {
    variables: {
      userId,
    },
    fetchPolicy: "network-only", // Ensure fresh data is fetched every time
  });

  // Fetch conquered badges using the query and variables
  const {
    data: conqueredBadgesData,
    loading: conqueredBadgesLoading,
    error: conqueredBadgesError,
    refetch: conqueredBadgesRefetch,
  } = useQuery(GET_CONQUERED_BADGES, {
    variables: {
      userId,
    },
    fetchPolicy: "network-only", // Ensure fresh data is fetched every time
  });

  const unconqueredBadges = unconqueredBadgesData?.unconqueredBadges || [];
  const conqueredBadges = conqueredBadgesData?.conqueredBadges || [];

  return {
    unconqueredBadges, // List of unconquered badges
    unconqueredBadgesLoading, // Loading state for unconquered badges
    unconqueredBadgesError, // Error state for unconquered badges
    unconqueredBadgesRefetch, // Refetch function for unconquered badges
    conqueredBadges, // List of conquered badges
    conqueredBadgesLoading, // Loading state for conquered badges
    conqueredBadgesError, // Error state for conquered badges
    conqueredBadgesRefetch, // Refetch function for conquered badges
  };
};
