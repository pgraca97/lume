// src/services/NotificationService.ts
import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { Badge } from '../models/Badge';

export class NotificationService {
    static async createBadgeNotification(
        userId: Types.ObjectId,
        badgeId: Types.ObjectId
    ) {
        const badge = await Badge.findById(badgeId);
        if (!badge) return null;

        return Notification.create({
            userId,
            type: NotificationType.BADGE_EARNED,
            title: 'New Badge Earned! 🏆',
            message: `Congratulations! You've earned the ${badge.name} badge!`,
            data: {
                badgeId: badge._id,
                badgeName: badge.name,
                badgeCategory: badge.category,
                badgeRarity: badge.rarity,
                earnedAt: new Date()
            }
        });
    }
}