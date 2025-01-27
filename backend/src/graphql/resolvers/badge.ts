// src/graphql/resolvers/badge.ts
import { Types } from 'mongoose';
import { Context } from '../../types/context';
import { requireAdmin, requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';
import { Badge, UserBadgeProgress, BadgeCategory, BadgeStatus, BadgeRarity } from '../../models/Badge';
import { User } from '../../models/User';
import { azureStorage } from '../../config/azureStorage';
import { NotificationService } from '../../services/NotificationService';

interface BadgeFilter {
    status?: BadgeStatus[];
    category?: BadgeCategory[];
    rarity?: BadgeRarity[];
}

interface BadgeSection {
    category: BadgeCategory;
    badges: Array<{
        id: string;
        key: string;
        name: string;
        description: string;
        category: BadgeCategory;
        rarity: BadgeRarity;
        assetPath: string;
        requirements: string[];
        xpReward: number;
        order: number;
        isActive: boolean;
        userProgress?: {
            status: BadgeStatus;
            progress: number;
            milestones: Array<{
                description: string;
                requiredCount: number;
                currentCount: number;
                completed: boolean;
            }>;
            achievedAt?: Date;
            lastUpdated: Date;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
}

interface UpdateBadgeProgressInput {
    status?: BadgeStatus;
    progress?: number;
    milestones?: Array<{
        description: string;
        currentCount: number;
    }>;
}


const getAuthUser = async (context: Context) => {
    const user = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: user.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    return dbUser; // No privacy check here
  };

  async function verifyProfileVisibility(
    targetUserId: Types.ObjectId,
    context: Context
  ) {
    const currentUser = await getAuthUser(context).catch(() => null);
    
    // Always allow access to own profile
    if (currentUser?._id.equals(targetUserId)) return true;
  
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) throw new ApplicationError('User not found', 404);
  
    if (targetUser.settings?.privacy?.profileVisibility === 'PRIVATE') {
      throw new ApplicationError('Profile is private', 403);
    }
  
    return true;
  }

export const badgeResolvers = {
    Query: {

        badgeStats: async (_: never, { userId }: { userId?: string }, context: Context) => {
            const targetUserId = userId 
            ? new Types.ObjectId(userId)
            : (await getAuthUser(context))._id;
    
          await verifyProfileVisibility(targetUserId, context);
        
            return calculateBadgeStats(targetUserId);
          },
        conqueredBadges: async (_: never, 
            { userId, filter, sort = 'ACHIEVED_DESC' }: { 
                userId?: string, 
                filter?: BadgeFilter,
                sort?: string 
            }, 
            context: Context
        ) => {
              // Get target user ID
              const targetUserId = userId 
              ? new Types.ObjectId(userId)
              : (await getAuthUser(context))._id;
      
            await verifyProfileVisibility(targetUserId, context);
            
            // Get completed badges with progress
            const progress = await UserBadgeProgress.find({
                userId: targetUserId,
                status: BadgeStatus.COMPLETED
            });
        
            // Build query
            const query: any = { 
                _id: { $in: progress.map(p => p.badgeId) },
                isActive: true
            };
            if (filter?.category) query.category = { $in: filter.category };
            if (filter?.rarity) query.rarity = { $in: filter.rarity };
        
            // Get badges and sort
            const badges = await Badge.find(query);
            const sortedBadges = sortBadges(badges, progress, sort, true);

            // Adding id mapping before grouping bc mongoose object id's
            const mappedBadges = sortedBadges.map(badge => ({
                ...badge.toObject(),
                id: badge._id.toString()
            }));
        
            // Group by category
            return groupBadgesByCategory(mappedBadges, progress);
        },
        
        unconqueredBadges: async (_: never, 
            { userId, filter, sort = 'PROGRESS_DESC' }: { 
                userId?: string, 
                filter?: BadgeFilter,
                sort?: string
            }, 
            context: Context
        ) => {
            const targetUserId = userId 
            ? new Types.ObjectId(userId)
            : (await getAuthUser(context))._id;
    
          await verifyProfileVisibility(targetUserId, context);
            
            // Get in-progress badges
            const progress = await UserBadgeProgress.find({
                userId: targetUserId,
                status: { $ne: BadgeStatus.COMPLETED }
            });
        
            // Build query
            const query: any = { 
                _id: { $in: progress.map(p => p.badgeId) },
                isActive: true
            };
            if (filter?.category) query.category = { $in: filter.category };
            if (filter?.rarity) query.rarity = { $in: filter.rarity };
        
            // Get badges and sort
            const badges = await Badge.find(query);
            const sortedBadges = sortBadges(badges, progress, sort, false);
        
                        // Adding id mapping before grouping bc mongoose object id's
                        const mappedBadges = sortedBadges.map(badge => ({
                            ...badge.toObject(),
                            id: badge._id.toString()
                        }));

            // Group by category
            return groupBadgesByCategory(mappedBadges, progress);
        }

    },

    Badge: {
        assetUrl: (parent: { assetPath: string }) => {
            return azureStorage.getSecureUrl(parent.assetPath);
        }
    },

    User: {
        badgeStats: async (parent: { _id: Types.ObjectId }, _: never, context: Context) => {
          try {
            // Get target user's full document
            const targetUser = await User.findById(parent._id);
            if (!targetUser) throw new ApplicationError('User not found', 404);
      
            // Check if current user is viewing their own profile
            let isSelf = false;
            try {
              const currentUser = await getAuthUser(context);
              isSelf = currentUser._id.equals(parent._id);
            } catch (error) {
              // If not authenticated, continue with public check
            }
      
            // Privacy check for non-self viewers
            if (!isSelf) {
              const visibility = targetUser.settings?.privacy?.profileVisibility || 'PUBLIC';
              if (visibility === 'PRIVATE') {
                throw new ApplicationError('Profile is private', 403);
              }
            }
      
            return calculateBadgeStats(parent._id);
          } catch (error) {
            if (error instanceof ApplicationError) throw error;
            throw new ApplicationError('Failed to fetch badge stats', 500);
          }
        }
      },

      Mutation: {
        initializeBadgeProgress: async (_: never, __: never, context: Context) => {
            const dbUser = await getAuthUser(context);
            
            // Get all active badges
            const badges = await Badge.find({ isActive: true });
            
            // Create initial progress for each badge
            const progress = await UserBadgeProgress.create(
                badges.map(badge => ({
                    userId: dbUser._id,
                    badgeId: badge._id,
                    status: BadgeStatus.LOCKED,
                    progress: 0,
                    milestones: badge.requirements.map(req => ({
                        description: req,
                        requiredCount: extractRequiredCount(req),
                        currentCount: 0,
                        completed: false
                    }))
                }))
            );
            
            return progress;
        },
    
        updateBadgeProgress: async (_: never, 
            { badgeId, userId, input }: { 
                badgeId: string;
                userId: string;
                input: UpdateBadgeProgressInput;
            }, 
            context: Context
        ) => {
            requireAdmin(context);
            
            const progress = await UserBadgeProgress.findOneAndUpdate(
                { badgeId, userId },
                { 
                    $set: {
                        ...input,
                        lastUpdated: new Date(),
                        ...(input.status === BadgeStatus.COMPLETED && {
                            achievedAt: new Date()
                        })
                    }
                },
                { new: true }
            );
    
            if (!progress) {
                throw new ApplicationError('Badge progress not found', 404);
            }

                       // Add notification for new completions
                       if (input.status === BadgeStatus.COMPLETED) {
                        try {
                            await NotificationService.createBadgeNotification(
                                new Types.ObjectId(userId),
                                new Types.ObjectId(badgeId)
                            );
                        } catch (error) {
                            console.error('Failed to create admin badge notification:', error);
                        }
                    }
    
            return progress;
        },
    
        resetBadgeProgress: async (_: never,
            { badgeId, userId }: { badgeId: string; userId: string },
            context: Context
        ) => {
            requireAdmin(context);
            
            const badge = await Badge.findById(badgeId);
            if (!badge) {
                throw new ApplicationError('Badge not found', 404);
            }
    
            const progress = await UserBadgeProgress.findOneAndUpdate(
                { badgeId, userId },
                {
                    status: BadgeStatus.LOCKED,
                    progress: 0,
                    milestones: badge.requirements.map(req => ({
                        description: req,
                        requiredCount: extractRequiredCount(req),
                        currentCount: 0,
                        completed: false
                    })),
                    achievedAt: null,
                    lastUpdated: new Date()
                },
                { new: true }
            );
    
            if (!progress) {
                throw new ApplicationError('Badge progress not found', 404);
            }
    
            return progress;
        }
    }
};

// Helper function to calculate badge statistics
async function calculateBadgeStats(userId: Types.ObjectId) {
    const [badges, progress] = await Promise.all([
        Badge.find({ isActive: true }),
        UserBadgeProgress.find({ userId })
    ]);

    // Create progress lookup
    const progressMap = new Map(
        progress.map(p => [p.badgeId.toString(), p])
    );

    // Calculate totals
    const completedBadges = progress.filter(
        p => p.status === BadgeStatus.COMPLETED
    );

    const totalXP = completedBadges.reduce((sum, p) => {
        const badge = badges.find(b => b._id.equals(p.badgeId));
        return sum + (badge?.xpReward || 0);
    }, 0);

    // Calculate category progress
    const categoryProgress = Object.values(BadgeCategory).map(category => {
        const categoryBadges = badges.filter(b => b.category === category);
        const completed = categoryBadges.filter(badge => 
            progressMap.get(badge._id.toString())?.status === BadgeStatus.COMPLETED
        );

        // Find next badge to complete
        const nextBadge = categoryBadges.find(badge => {
            const progress = progressMap.get(badge._id.toString());
            return progress?.status !== BadgeStatus.COMPLETED;
        });

        return {
            category,
            completed: completed.length,
            total: categoryBadges.length,
            nextBadge // Include full badge object with progress
        };
    });

    return {
        totalBadges: badges.length,
        completedBadges: completedBadges.length,
        totalXP,
        categoryProgress
    };
}

// Helper function to group badges by category
function groupBadgesByCategory(badges: any[], progress: any[]): BadgeSection[] {
    const progressMap = new Map(progress.map(p => [p.badgeId.toString(), p]));
  
    // Get sorted categories according to our priority
    const sortedCategories = Object.values(BadgeCategory)
      .sort((a, b) => categoryOrder(a) - categoryOrder(b));
  
    return sortedCategories
      .map(category => ({
        category,
        badges: badges
          .filter(badge => badge.category === category)
          .map(badge => ({
            ...badge,
            userProgress: progressMap.get(badge._id.toString())
          }))
      }))
      .filter(section => section.badges.length > 0);
  }

// Helper function to sort badges
function sortBadges(
    badges: any[], 
    progress: any[],
    sortOption?: string,
    isConquered = false
) {
    const progressMap = new Map(progress.map(p => [p.badgeId.toString(), p]));
    
    return [...badges].sort((a, b) => {
        const progressA = progressMap.get(a._id.toString());
        const progressB = progressMap.get(b._id.toString());

        switch(sortOption) {
            // Conquered badge sorting
            case 'ACHIEVED_DESC':
                return (progressB?.achievedAt || 0) - (progressA?.achievedAt || 0);
            case 'ACHIEVED_ASC':
                return (progressA?.achievedAt || 0) - (progressB?.achievedAt || 0);
                
            // Unconquered badge sorting
            case 'PROGRESS_DESC':
                return (progressB?.progress || 0) - (progressA?.progress || 0);
            case 'PROGRESS_ASC':
                return (progressA?.progress || 0) - (progressB?.progress || 0);
            case 'RARITY_ASC':
                return rarityValue(a.rarity) - rarityValue(b.rarity);
            case 'RARITY_DESC':
                return rarityValue(b.rarity) - rarityValue(a.rarity);
            
            // Default category sorting
            case 'CATEGORY':
            default:
                const catCompare = categoryOrder(a.category) - categoryOrder(b.category);
                if (catCompare !== 0) return catCompare;
                
                // Secondary sort - by achievement date for conquered, by progress for unconquered
                return isConquered 
                    ? (progressB?.achievedAt || 0) - (progressA?.achievedAt || 0)
                    : (progressB?.progress || 0) - (progressA?.progress || 0);
        }
    });
}

// Helper function to get rarity numeric value
function rarityValue(rarity: string): number {
    const values = {
        'COMMON': 1,
        'UNCOMMON': 2,
        'RARE': 3,
        'LEGENDARY': 4
    };
    return values[rarity as keyof typeof values] || 1;
}

// Helper function to get category order
function categoryOrder(category: string): number {
    const order = {
      'EFFICIENCY': 1,    // Highest priority
      'COOKING_STYLE': 2,
      'MEAL_TYPE': 3,
      'EXPERTISE': 4,
      'SPECIAL': 5        // Lowest priority
    };
    return order[category as keyof typeof order] || 99;
  }

  // Helper function to extract required count from requirement string
export function extractRequiredCount(requirement: string): number {
    const match = requirement.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
}