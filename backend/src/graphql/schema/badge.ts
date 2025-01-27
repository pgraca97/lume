// src/graphql/schema/badge.ts
export const badgeTypeDefs = `#graphql
enum BadgeCategory {
    COOKING_STYLE
    MEAL_TYPE
    EXPERTISE
    EFFICIENCY
    SPECIAL
}

enum BadgeRarity {
    COMMON
    UNCOMMON
    RARE
    LEGENDARY
}

enum BadgeStatus {
    LOCKED
    HIDDEN
    VISIBLE
    COMPLETED
}

"""
Sorting options for conquered badges
"""
enum ConqueredBadgeSortOption {
    ACHIEVED_DESC    # Most recently achieved first
    ACHIEVED_ASC     # First achieved first
    CATEGORY        # Group by category
}

"""
Sorting options for unconquered badges
"""
enum UnconqueredBadgeSortOption {
    PROGRESS_DESC    # Closest to achieving first
    PROGRESS_ASC     # Furthest from achieving first
    RARITY_ASC       # Common to Legendary
    RARITY_DESC      # Legendary to Common
    CATEGORY        # Group by category
}

type BadgeMilestone {
    description: String!
    requiredCount: Int!
    currentCount: Int!
    completed: Boolean!
}

type Badge {
    id: ID!
    key: String!
    name: String!
    description: String!
    category: BadgeCategory!
    rarity: BadgeRarity!
    assetUrl: String!            # Full Azure URL
    requirements: [String!]!
    xpReward: Int!
    order: Int!
    isActive: Boolean!
    userProgress: BadgeProgress  # Current user's progress
    createdAt: DateTime!
    updatedAt: DateTime!
}

type BadgeProgress {
    status: BadgeStatus!
    progress: Int!               # 0-100
    milestones: [BadgeMilestone!]!
    achievedAt: DateTime
    lastUpdated: DateTime!
}

type BadgeSection {
    category: BadgeCategory!
    badges: [Badge!]!
}

type BadgeStats {
    totalBadges: Int!
    completedBadges: Int!
    totalXP: Int!
    categoryProgress: [CategoryProgress!]!
}

type CategoryProgress {
    category: BadgeCategory!
    completed: Int!
    total: Int!
    nextBadge: Badge
}

"""
Filter for badge queries
"""
input BadgeFilter {
    category: [BadgeCategory!]  # Filter by category
    rarity: [BadgeRarity!]      # Filter by rarity level
}


"""
Badge sorting options
"""
enum BadgeSortOption {
    PROGRESS_DESC    # Show highest progress first
    PROGRESS_ASC     # Show lowest progress first
    NEWEST          # Recently updated
    OLDEST          # Oldest first
    CATEGORY        # Group by category
}

input UpdateBadgeProgressInput {
    status: BadgeStatus
    progress: Int
    milestones: [UpdateMilestoneInput!]
}

input UpdateMilestoneInput {
    description: String!
    currentCount: Int!
}

extend type Query {

    
    """
    Get user's badge statistics
    """
    badgeStats(
    userId: ID  
  ): BadgeStats!
    

    """
    Get conquered badges for authenticated user or another user
    """
    conqueredBadges(
        userId: ID          # Optional - if not provided, get authenticated user's badges
        filter: BadgeFilter
        sort: ConqueredBadgeSortOption = ACHIEVED_DESC
    ): [BadgeSection!]!

    """
    Get unconquered badges for authenticated user or another user
    """
    unconqueredBadges(
        userId: ID          # Optional - if not provided, get authenticated user's badges
        filter: BadgeFilter
        sort: UnconqueredBadgeSortOption = PROGRESS_DESC
    ): [BadgeSection!]!
}


extend type Mutation {
    """
    Initialize badge progress for a user
    Called when user completes onboarding
    """
    initializeBadgeProgress: [BadgeProgress!]!

    """
    Update badge progress manually (admin only) - future use
    """
    updateBadgeProgress(
        badgeId: ID!
        userId: ID!
        input: UpdateBadgeProgressInput!
    ): BadgeProgress!

    """
    Reset badge progress (admin only)
    Useful for fixing incorrect progress
    """
    resetBadgeProgress(
        badgeId: ID!
        userId: ID!
    ): BadgeProgress!
}

`;