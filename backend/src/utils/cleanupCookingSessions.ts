// src/jobs/cleanupCookingSessions.ts
import { CookingSession } from "../models/CookingSession";

const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 120; // 2 hours in minutes

export const startCleanupJob = () => {
    const cleanup = async () => {
        try {
            const result = await CookingSession.checkAbandoned(SESSION_TIMEOUT);
            if (result.modifiedCount > 0) {
                console.log(`Marked ${result.modifiedCount} inactive sessions as abandoned`);
            }
        } catch (error) {
            console.error('Error in cooking session cleanup:', error);
        }
    };

    // Run immediately and then on interval
    cleanup();
    return setInterval(cleanup, CLEANUP_INTERVAL);
};