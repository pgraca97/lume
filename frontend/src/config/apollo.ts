// src/config/apollo.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import auth from "@react-native-firebase/auth";
import { env } from "./env";

// HTTP connection
const httpLink = createHttpLink({
  uri: `${env.apiUrl}/graphql`,
});

// Error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Enhanced auth middleware
const authLink = setContext(async (_, { headers }) => {
  try {
    const user = auth().currentUser;
    if (!user) return { headers };

    const token = await user.getIdToken(true); // Force token refresh

    return {
      headers: {
        ...headers,
        authorization: `Bearer ${token}`,
      },
    };
  } catch (error) {
    console.error("Auth token error:", error);
    // Add your logout logic here if needed
    return { headers };
  }
});

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    User: {
      keyFields: ["id"], // Ensure proper normalization
      fields: {
        preferences: {
          merge: true,
        },
      },
    },
  },
});

// Client configuration
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
    mutate: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});
