// src/graphql/operations/auth.ts
import { gql } from "@apollo/client";
import { USER_FIELDS } from "../schema/user";

// Does not exist in the backend - implement this after if needed
/* export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`; */
