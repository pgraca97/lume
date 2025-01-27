// src/graphql/schema/shoppingList.ts

export const shoppingListTypeDefs = `#graphql
  """
  Possible states for a shopping list
  """
  enum ListStatus {
    ACTIVE
    COMPLETED
    ARCHIVED
  }

  """
  Categories for shopping list items
  """
  enum ItemCategory {
    FRESH     # Frescos
    GROCERY   # Mercearia
    FROZEN    # Congelados
    BEVERAGES # Bebidas
    OTHER     # Outros
  }

  """
  Units for shopping list items
  """
  enum ItemUnit {
    g   # grams
    kg  # kilograms
    ml  # milliliters
    l   # liters
    uni # units
  }

  """
  Statistics for items in a category
  """
  type CategoryStats {
    total: Int!
    completed: Int!
  }

  """
  Statistics for all categories in a list
  """
  type ItemStatistics {
    totalItems: Int!
    completedItems: Int!
    itemsByCategory: [CategoryStatEntry!]!
}

  """
  Entry for category-specific statistics
  """
  type CategoryStatEntry {
    category: ItemCategory!
    stats: CategoryStats!
  }

  """
  Shopping list item with optional ingredient reference
  """
  type ShoppingListItem {
    id: ID!
    ingredient: Ingredient     # Optional reference to ingredient
    customName: String        # Used when no ingredient reference
    category: ItemCategory!
    quantity: Float
    unit: ItemUnit
    isCompleted: Boolean!
    note: String
    addedBy: User!
    addedAt: DateTime!
    completedAt: DateTime
  }

  """
  Shopping list with items and statistics
  """
  type ShoppingList {
    id: ID!
    title: String!
    status: ListStatus!
    isPinned: Boolean!
    hideCompleted: Boolean!
    items: [ShoppingListItem!]!
    itemStats: ItemStatistics!
    lastModifiedAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Summary of shopping list limits
  """
  type ShoppingListLimits {
    maxActiveLists: Int!
    maxItemsPerList: Int!
    maxCompletedLists: Int!
    maxNoteLength: Int!
    currentActiveLists: Int!
    currentCompletedLists: Int!
  }

  """
  Input for creating a new shopping list
  """
  input CreateShoppingListInput {
    title: String!
    isPinned: Boolean = false
  }

  """
  Input for updating a shopping list
  """
  input UpdateShoppingListInput {
    title: String
    isPinned: Boolean
    hideCompleted: Boolean
  }

  input ForceDelete {
    force: Boolean!
}

  """
  Input for adding an item to a shopping list
  """
  input AddShoppingListItemInput {
    listId: ID!
    ingredientId: ID          # Optional ingredient reference
    customName: String        # Required if no ingredientId
    category: ItemCategory!
    quantity: Float
    unit: ItemUnit
    note: String
  }

  """
  Input for updating a shopping list item
  """
  input UpdateShoppingListItemInput {
    listId: ID!
    itemId: ID!
    quantity: Float
    unit: ItemUnit
    note: String
    category: ItemCategory
  }

  """
  Input for toggling item completion status
  """
  input ToggleItemCompletionInput {
    listId: ID!
    itemId: ID!
  }

  """
  Response for list operations
  """
  type ShoppingListResponse {
    success: Boolean!
    message: String
    list: ShoppingList
  }

  extend type Query {
    """
    Get all shopping lists for current user
    """
    shoppingLists(
      status: [ListStatus!] = [ACTIVE]
    ): [ShoppingList!]!

    """
    Get a specific shopping list by ID
    """
    shoppingList(id: ID!): ShoppingList!

    """
    Get current user's pinned shopping list
    """
    pinnedShoppingList: ShoppingList

    """
    Get shopping list limits and current usage
    """
    shoppingListLimits: ShoppingListLimits!
  }

  extend type Mutation {
    """
    Create a new shopping list
    """
    createShoppingList(
      input: CreateShoppingListInput!
    ): ShoppingListResponse!

    """
    Update an existing shopping list
    """
    updateShoppingList(
      id: ID!
      input: UpdateShoppingListInput!
    ): ShoppingListResponse!

    """
    Delete a shopping list (with confirmation in resolver)
    """
    deleteShoppingList(id: ID!, input: ForceDelete): ShoppingListResponse!

    """
    Add an item to a shopping list
    """
    addShoppingListItem(
      input: AddShoppingListItemInput!
    ): ShoppingListResponse!

    """
    Update a shopping list item
    """
    updateShoppingListItem(
      input: UpdateShoppingListItemInput!
    ): ShoppingListResponse!

    """
    Remove an item from a shopping list
    """
    removeShoppingListItem(
      listId: ID!
      itemId: ID!
    ): ShoppingListResponse!

    """
    Toggle completion status of a shopping list item
    """
    toggleShoppingListItem(
      input: ToggleItemCompletionInput!
    ): ShoppingListResponse!

    """
    Mark all items in a list as completed/uncompleted
    """
    toggleAllShoppingListItems(
      listId: ID!
      completed: Boolean!
    ): ShoppingListResponse!

    """
    Clear all completed items from a list
    """
    clearCompletedItems(
      listId: ID!
    ): ShoppingListResponse!

    """
    Archive a completed shopping list
    """
    archiveShoppingList(
      id: ID!
    ): ShoppingListResponse!
  }
`;