/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new user account */
  createUser: User;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Get currently authenticated user */
  me?: Maybe<User>;
  /** Test query that doesn't require authentication */
  testUser: User;
  /** List all users (admin only) */
  users: Array<User>;
};

/**
 * User type representing a registered user in the system
 * Contains authentication and preference information
 */
export type User = {
  __typename?: 'User';
  createdAt: Scalars['String']['output'];
  /** User's email address */
  email: Scalars['String']['output'];
  /** Firebase unique identifier */
  firebaseUid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** User's preferences including diet and allergies */
  preferences: UserPreferences;
  updatedAt: Scalars['String']['output'];
};

/** User preferences for dietary restrictions and allergies */
export type UserPreferences = {
  __typename?: 'UserPreferences';
  /** List of food allergies */
  allergies: Array<Scalars['String']['output']>;
  /** List of dietary preferences (e.g., vegan, vegetarian) */
  diet: Array<Scalars['String']['output']>;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } } | null };

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } } };

export type UserFieldsFragment = { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } };

export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firebaseUid"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diet"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const GetCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firebaseUid"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diet"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firebaseUid"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"diet"}},{"kind":"Field","name":{"kind":"Name","value":"allergies"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new user account */
  createUser: User;
};


export type MutationCreateUserArgs = {
  email: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Get currently authenticated user */
  me?: Maybe<User>;
  /** Test query that doesn't require authentication */
  testUser: User;
  /** List all users (admin only) */
  users: Array<User>;
};

/**
 * User type representing a registered user in the system
 * Contains authentication and preference information
 */
export type User = {
  __typename?: 'User';
  createdAt: Scalars['String']['output'];
  /** User's email address */
  email: Scalars['String']['output'];
  /** Firebase unique identifier */
  firebaseUid: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** User's preferences including diet and allergies */
  preferences: UserPreferences;
  updatedAt: Scalars['String']['output'];
};

/** User preferences for dietary restrictions and allergies */
export type UserPreferences = {
  __typename?: 'UserPreferences';
  /** List of food allergies */
  allergies: Array<Scalars['String']['output']>;
  /** List of dietary preferences (e.g., vegan, vegetarian) */
  diet: Array<Scalars['String']['output']>;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } } | null };

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } } };

export type UserFieldsFragment = { __typename?: 'User', id: string, firebaseUid: string, email: string, createdAt: string, updatedAt: string, preferences: { __typename?: 'UserPreferences', diet: Array<string>, allergies: Array<string> } };

export const UserFieldsFragmentDoc = gql`
    fragment UserFields on User {
  id
  firebaseUid
  email
  preferences {
    diet
    allergies
  }
  createdAt
  updatedAt
}
    `;
export const GetCurrentUserDocument = gql`
    query GetCurrentUser {
  me {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

/**
 * __useGetCurrentUserQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
      }
export function useGetCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
        }
export function useGetCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCurrentUserQuery, GetCurrentUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>(GetCurrentUserDocument, options);
        }
export type GetCurrentUserQueryHookResult = ReturnType<typeof useGetCurrentUserQuery>;
export type GetCurrentUserLazyQueryHookResult = ReturnType<typeof useGetCurrentUserLazyQuery>;
export type GetCurrentUserSuspenseQueryHookResult = ReturnType<typeof useGetCurrentUserSuspenseQuery>;
export type GetCurrentUserQueryResult = Apollo.QueryResult<GetCurrentUserQuery, GetCurrentUserQueryVariables>;
export const CreateUserDocument = gql`
    mutation CreateUser($email: String!) {
  createUser(email: $email) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;