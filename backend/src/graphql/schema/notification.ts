import { sharedTypeDefs } from "./shared";

// src/graphql/schema/notification.ts
export const notificationTypeDefs = `#graphql

${sharedTypeDefs}
  enum NotificationType {
    BADGE_EARNED
  }

  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    data: JSON!
    read: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    unreadCount: Int!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  extend type Query {
    """
    Get paginated notifications for current user
    """
    notifications(
      first: Int = 10
      after: String
      filter: NotificationFilter
    ): NotificationConnection!
  }

  input NotificationFilter {
    read: Boolean
    type: [NotificationType!]
  }

  extend type Mutation {
    """
    Mark notifications as read
    """
    markNotificationsRead(
      ids: [ID!]!
    ): Boolean!

    """
    Delete notifications
    """
    deleteNotifications(
      ids: [ID!]!
    ): Boolean!
  }
`;