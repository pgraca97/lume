// src/graphql/schema/table.ts

export const tableTypeDefs = `#graphql
enum TablePrivacy {
  PRIVATE
  SHARED
  PUBLIC
}

enum CollaboratorRole {
  OWNER
  EDITOR
  VIEWER
}


enum TableSortOption {
  TITLE             
  ACTIVITY  
  CREATED      
}

enum SavedRecipeSortBy {
  SAVE_DATE
  RECIPE_DATE
  TITLE
  RATING
  DIFFICULTY
}

enum SavedRecipeFilter {
  ALL
  OWNED_TABLES
  COLLABORATED
  PUBLIC
  PRIVATE
}

type TableCollaborator {
  user: User!
  role: CollaboratorRole!
  addedAt: DateTime!
  addedBy: User!
}

type TableRecipe {
  recipe: Recipe!
  addedAt: DateTime!
  addedBy: User!
}

type Table {
  id: ID!
  title: String!
  subtitle: String
  emoji: String
  privacy: TablePrivacy!
  owner: User!
  collaborators: [TableCollaborator!]!
  recipes: [TableRecipe!]!
  recentThumbnails: [String!]!
  recipeCount: Int!
  isCollaborator: Boolean!
  canEdit: Boolean
  myRole: CollaboratorRole
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActivityAt: DateTime!
}

type TableStats {
  totalTables: Int!
  groupTables: Int!    # Tables with collaborators
  secretTables: Int    # Only for myTableStats (null for others)
  publicTables: Int!
  privateTables: Int   # Only for myTableStats
}

input CreateTableInput {
  title: String!
  subtitle: String
  emoji: String
  privacy: TablePrivacy = PRIVATE
}

input UpdateTableInput {
  title: String
  subtitle: String
  emoji: String
  privacy: TablePrivacy
}

input AddCollaboratorInput {
  tableId: ID!
  userId: ID!
  role: CollaboratorRole!
}

enum TableFilter {
  GROUP
  SECRET
  ALL
}

input MyTablesFilter {
  type: TableFilter
  sortBy: TableSortOption
}


input SavedRecipesFilter {
  difficulty: Int
  tags: [String!]
  sortBy: SavedRecipeSortBy = SAVE_DATE
  filter: SavedRecipeFilter = ALL
}

type SavedRecipe {
 recipe: Recipe!
 savedAt: DateTime!
 tableId: ID!
 tableName: String!
}

type SavedRecipesResponse {
 recipes: [SavedRecipe!]!
 totalCount: Int!
 stats: SavedRecipesStats
}

type SavedRecipesStats {
  byDifficulty: [DifficultyCount!]!
}

type DifficultyCount {
  level: Int!
  count: Int!
}

type UnplannedTableStats {
  exists: Boolean!
  recipeCount: Int!
  tableId: ID
}

type SavedRecipesCount {
  total: Int!
  tableCount: Int!
}

type CookbookStats {
    unplannedMeals: UnplannedTableStats!
    savedRecipes: SavedRecipesCount!
  }


extend type Query {
  """Get a table by ID"""
  table(id: ID!): Table
  
  """Get tables where user is a collaborator"""
  myTables(
    filter: MyTablesFilter
    limit: Int = 10
    offset: Int = 0
  ): [Table!]!
  
  """Get all recipes saved by the user with optional filtering and sorting"""
  savedRecipes(
    filter: SavedRecipesFilter
    limit: Int = 10
    offset: Int = 0
  ): SavedRecipesResponse!
  
  """Get user's table stats"""
  myTableStats: TableStats!
  
  """Get another user's table (public + where viewer is a collaborator)"""
  userTables(
    userId: ID!
    limit: Int = 10
    offset: Int = 0
  ): [Table!]!
  
  """Get another user's table stats (only counting accessible tables)"""
  userTableStats(userId: ID!): TableStats!
  
  """Search public tables"""
  searchTables(
    query: String
    limit: Int = 10
    offset: Int = 0
  ): [Table!]!

  """Get default tables (Unplanned Meals, My Saved Recipes)"""
  cookbookStats: CookbookStats!
}

extend type Mutation {
  """Create a new table"""
  createTable(input: CreateTableInput!): Table!
  
  """Update table details"""
  updateTable(
    id: ID!
    input: UpdateTableInput!
  ): Table!
  
  """Delete a table"""
  deleteTable(id: ID!): Boolean!
  
  """Add a recipe to table"""
  addRecipeToTable(
    tableId: ID
    recipeId: ID!
  ): Table!

  """ Add recipe to unplanned meals table """
  addRecipeToUnplannedMeals(recipeId: ID!): Table!
  
  """Remove a recipe from table"""
  removeRecipeFromTable(
    tableId: ID!
    recipeId: ID!
  ): Table!
  
  """Add a collaborator to table"""
  addTableCollaborator(
    input: AddCollaboratorInput!
  ): Table!
  
  """Remove a collaborator from table"""
  removeTableCollaborator(
    tableId: ID!
    userId: ID!
  ): Table!
  
  """Update collaborator role"""
  updateTableCollaboratorRole(
    tableId: ID!
    userId: ID!
    role: CollaboratorRole!
  ): Table!
}
`;
