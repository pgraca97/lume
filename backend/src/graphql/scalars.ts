// src/graphql/scalars.ts
import { JSONResolver, DateTimeResolver } from 'graphql-scalars';

export const scalarResolvers = {
  JSON: JSONResolver,
  DateTime: DateTimeResolver
};

export const scalarTypeDefs = `#graphql
  scalar JSON
  scalar DateTime
`;