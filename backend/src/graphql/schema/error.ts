// src/graphql/schema/error.ts
export const errorTypeDefs = `#graphql
  interface Error {
    message: String!
    code: String!
  }

  type ValidationError implements Error {
    message: String!
    code: String!
    field: String!
  }

  type DuplicateError implements Error {
    message: String!
    code: String!
    currentServings: Int
  }
`;