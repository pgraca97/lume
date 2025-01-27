// src/services/NotificationWatcherService.ts
import { Types } from 'mongoose';
import type { ChangeStream, ChangeStreamDocument } from 'mongodb';
import { UserBadgeProgress } from '../models/Badge';
import { NotificationService } from './NotificationService';
import { BadgeStatus } from '../models/Badge';

// Define types for better type safety
type UserBadgeProgressDocument = InstanceType<typeof UserBadgeProgress>;
type ChangeHandler = (change: ChangeStreamDocument<UserBadgeProgressDocument>) => Promise<void>;
type ErrorHandler = (error: Error) => void;

// Temporary storage to prevent duplicate processing
const processedIds = new Set<string>();
let restartAttempts = 0;

export class NotificationWatcherService {
    private static changeStream: ChangeStream<UserBadgeProgressDocument> | null = null;
    
    static async start() {
        // Define what changes we're interested in
        const pipeline = [
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { operationType: 'insert' },
                                { 
                                    operationType: 'update',
                                    'updateDescription.updatedFields.status': BadgeStatus.COMPLETED
                                }
                            ]
                        },
                        { 
                            'fullDocument.status': BadgeStatus.COMPLETED,
                            'fullDocument.achievedAt': { $exists: false }
                        }
                    ]
                }
            }
        ];
        
        try {
            // Start watching the collection with proper typing
            this.changeStream = UserBadgeProgress.watch(pipeline, {
                fullDocument: 'updateLookup'
            }) as ChangeStream<UserBadgeProgressDocument>;
            
            // Use proper event handler types
            this.changeStream.on('change', this.handleChange as ChangeHandler);
            this.changeStream.on('error', this.handleError as ErrorHandler);
            
            console.log('🎯 Notification watcher started');
            restartAttempts = 0;
            
        } catch (error) {
            console.error('🔥 Failed to start watcher:', error);
            const safeError = error instanceof Error ? error : new Error(String(error));
            this.handleError(safeError);
        }
    }
    
    private static async handleChange(change: ChangeStreamDocument<UserBadgeProgressDocument>) {
        try {
            // Add type guard for valid change events
            const isChangeWithDocument = (
                change.operationType === 'insert' ||
                change.operationType === 'update' ||
                change.operationType === 'replace'
            );
            
            if (!isChangeWithDocument || !change.fullDocument) {
                console.log('🚨 Ignoring non-document change:', change.operationType);
                return;
            }
            
            const badgeProgress = change.fullDocument;
            
            if (!badgeProgress) {
                console.log('🚨 Change event missing document');
                return;
            }
            
            const docId = badgeProgress.id;
            
            if (processedIds.has(docId)) {
                console.log('⏭️ Already processed', docId);
                return;
            }
            
            processedIds.add(docId);
            setTimeout(() => processedIds.delete(docId), 300000);
            
            if (!badgeProgress.achievedAt) {
                console.log('🆕 Processing badge completion:', docId);
                await NotificationService.createBadgeNotification(
                    badgeProgress.userId as Types.ObjectId,
                    badgeProgress.badgeId as Types.ObjectId
                );
            }
            
        } catch (error) {
            console.error('💥 Error processing change:', error);
        }
    }
    
    private static handleError(error: Error) {
        console.error('🚑 Change stream error:', error.message);
        
        if (this.changeStream) {
            this.changeStream.close();
            this.changeStream = null;
        }
        
        const delay = Math.min(2000 * Math.pow(2, restartAttempts), 30000);
        console.log(`⏳ Restarting in ${delay}ms (attempt ${restartAttempts + 1})`);
        
        setTimeout(() => {
            restartAttempts++;
            this.start().catch(console.error);
        }, delay);
    }
    
    static stop() {
        if (this.changeStream) {
            console.log('🛑 Stopping notification watcher');
            this.changeStream.close();
            this.changeStream = null;
            processedIds.clear();
        }
    }
}