// src/graphql/resolvers/notification.ts
import { Types } from 'mongoose';
import { Context } from '../../types/context';
import { requireAuth } from '../../utils/auth';
import { ApplicationError } from '../../utils/errors';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';

export const notificationResolvers = {
    Query: {
        notifications: async (_: never,
            { first = 10, after, filter }: { 
                first: number;
                after?: string;
                filter?: { 
                    read?: boolean;
                    type?: string[];
                }
            },
            context: Context
        ) => {
            const user = await getAuthUser(context);

            // Build query
            const query: any = { userId: user._id };
            if (filter?.read !== undefined) query.read = filter.read;
            if (filter?.type) query.type = { $in: filter.type };

            // Handle pagination
            if (after) {
                query._id = { $lt: new Types.ObjectId(after) };
            }

            // Get total and unread counts
            const [totalCount, unreadCount] = await Promise.all([
                Notification.countDocuments({ userId: user._id }),
                Notification.countDocuments({ userId: user._id, read: false })
            ]);

            // Get notifications
            const notifications = await Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(first + 1); // Get one extra to check if there are more

            const hasNextPage = notifications.length > first;
            const edges = notifications.slice(0, first).map(notification => ({
                node: notification,
                cursor: notification.id
            }));

            return {
                edges,
                pageInfo: {
                    hasNextPage,
                    endCursor: edges.length ? edges[edges.length - 1].cursor : null
                },
                totalCount,
                unreadCount
            };
        }
    },

    Mutation: {
        markNotificationsRead: async (_: never,
            { ids }: { ids: string[] },
            context: Context
        ) => {
            const user = await getAuthUser(context);

            const result = await Notification.updateMany(
                { 
                    _id: { $in: ids.map(id => new Types.ObjectId(id)) },
                    userId: user._id
                },
                { $set: { read: true } }
            );

            return result.modifiedCount > 0;
        },

        deleteNotifications: async (_: never,
            { ids }: { ids: string[] },
            context: Context
        ) => {
            const user = await getAuthUser(context);

            const result = await Notification.deleteMany({
                _id: { $in: ids.map(id => new Types.ObjectId(id)) },
                userId: user._id
            });

            return result.deletedCount > 0;
        }
    }
};

const getAuthUser = async (context: Context) => {
    const authUser = requireAuth(context);
    const dbUser = await User.findOne({ firebaseUid: authUser.uid });
    if (!dbUser) throw new ApplicationError('User not found', 404);
    return dbUser;
};