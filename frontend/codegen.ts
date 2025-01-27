// codegen.ts
import { CodegenConfig } from '@graphql-codegen/cli';
import { env } from './src/config/env';

const config: CodegenConfig = {
  // Your GraphQL Endpoint - update this with your actual endpoint
  schema: `${env.apiUrl}/graphql`,
  
  // Files to scan for GraphQL operations
  documents: ['src/**/*.{ts,tsx}'],
  
  // Output configurations
  generates: {
    './src/types/generated/': {
      preset: 'client',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        skipTypename: false,
        dedupeFragments: true,
      },
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false
      }
    }
  },
  
  // Useful for development
  ignoreNoDocuments: process.env.NODE_ENV === 'development'
};

export default config;