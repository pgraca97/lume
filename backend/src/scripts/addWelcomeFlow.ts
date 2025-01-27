// src/scripts/addWelcomeFlow.ts
import mongoose from 'mongoose';
import { User, WelcomeStep } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const updateExistingUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('📦 Connected to MongoDB');

        const result = await User.updateMany(
            // Where welcomeFlow doesn't exist
            { welcomeFlow: { $exists: false } },
            {
                $set: {
                    welcomeFlow: {
                        isCompleted: false,
                        completedSteps: [],
                        currentStep: WelcomeStep.GREETINGS
                    }
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} users`);
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateExistingUsers();