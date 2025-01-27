// src/scripts/initializeBadges.ts
import mongoose from 'mongoose';
import { Badge, BadgeStatus } from '../models/Badge';
import { User } from '../models/User';
import { UserBadgeProgress } from '../models/Badge';
import dotenv from 'dotenv';

dotenv.config();

const initializeBadges = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // First, ensure all badges exist in the database
        const defaultBadges = [
            {
                key: 'budget-master',
                name: 'Chef dos Pobres',
                description: 'Master of turning pocket change into culinary gold. Your wallet may be light, but your flavors are rich!',
                category: 'EFFICIENCY',
                rarity: 'UNCOMMON',
                assetPath: 'badges/budget-master.svg',
                requirements: [
                    'Complete 15 budget-friendly recipes',
                    'Keep average cost per serving under €3.50',
                    'Cook 8 different budget recipes',
                    'Save a total of €50',
                    'Maintain a 3-week streak'
                ],
                xpReward: 100,
                order: 1
            },
            {
                key: 'meal-prep-king',
                name: 'Rei da Marmita',
                description: 'The supreme ruler of meal prep. Your fridge is your kingdom, and Tupperware is your crown!',
                category: 'EFFICIENCY',
                rarity: 'RARE',
                assetPath: 'badges/meal-prep-king.svg',
                requirements: [
                    'Complete 8 batch cooking sessions',
                    'Plan 4 full weeks of meals',
                    'Accumulate 8 hours of prep time',
                    'Reuse recipes 3 times',
                    'Master 4 portion sizes'
                ],
                xpReward: 150,
                order: 2
            },
            {
                key: 'hangover-master',
                name: 'Ressaca Master',
                description: 'The hero we need after midnight. Turning post-party cravings into culinary salvation!',
                category: 'EXPERTISE',
                rarity: 'UNCOMMON',
                assetPath: 'badges/hangover-master.svg',
                requirements: [
                    'Cook 5 late-night meals (11 PM - 4 AM)',
                    'Complete 10 quick recipes',
                    'Master 4 weekend brunches',
                    'Perfect 6 comfort food recipes',
                    'Create 3 hangover fix meals'
                ],
                xpReward: 100,
                order: 3
            },
            {
                key: 'snack-champion',
                name: 'Snack Champion',
                description: 'The ultimate snack alchemist. Making study sessions tastier, one bite at a time!',
                category: 'MEAL_TYPE',
                rarity: 'COMMON',
                assetPath: 'badges/snack-champion.svg',
                requirements: [
                    'Create 12 different snack recipes',
                    'Keep 50% healthy snack ratio',
                    'Complete 20 snack sessions',
                    'Master 5 snack categories',
                    'Share 8 portions with friends'
                ],
                xpReward: 75,
                order: 4
            },
            {
                key: 'banquet-boss',
                name: 'Boss do Banquete',
                description: 'The party hosting legend. Your kitchen is where FOMO begins!',
                category: 'EXPERTISE',
                rarity: 'RARE',
                assetPath: 'badges/banquet-boss.svg',
                requirements: [
                    'Complete 8 large batch recipes',
                    'Serve 30 total guests',
                    'Master 5 complex recipes',
                    'Cook 6 event recipes',
                    'Prepare 3 different dishes per event'
                ],
                xpReward: 150,
                order: 5
            },
            {
                key: 'brunch-time',
                name: 'Brunch Time',
                description: 'The weekend warrior of breakfast-lunch fusion. Making mornings worth waking up for!',
                category: 'MEAL_TYPE',
                rarity: 'UNCOMMON',
                assetPath: 'badges/brunch-time.svg',
                requirements: [
                    'Create 10 brunch recipes',
                    'Host 6 weekend brunches',
                    'Master 4 brunch categories',
                    'Host 4 brunch gatherings',
                    'Perfect 5 brunch timings'
                ],
                xpReward: 100,
                order: 6
            },
            {
                key: 'plant-based-lover',
                name: 'Plant Based Lover',
                description: 'The green cuisine guru. Making vegetables so good, even rabbits get jealous!',
                category: 'COOKING_STYLE',
                rarity: 'UNCOMMON',
                assetPath: 'badges/plant-based-lover.svg',
                requirements: [
                    'Complete 15 vegan recipes',
                    'Maintain 7-day vegan streak',
                    'Use 20 unique plant ingredients',
                    'Master 8 seasonal recipes',
                    'Convert 5 regular recipes to vegan'
                ],
                xpReward: 100,
                order: 7
            },
            {
                key: 'zero-waste-hero',
                name: 'Zero Waste Hero',
                description: 'The sustainability superhero. Your leftovers have leftovers, and they\'re all delicious!',
                category: 'COOKING_STYLE',
                rarity: 'RARE',
                assetPath: 'badges/zero-waste-hero.svg',
                requirements: [
                    'Complete 10 leftover recipes',
                    'Reuse 15 ingredients across recipes',
                    'Achieve 90% shopping list completion',
                    'Maintain 85% portion accuracy',
                    'Reduce waste by 70%'
                ],
                xpReward: 150,
                order: 8
            },
            {
                key: 'sweet-master',
                name: 'Docinho do Lumo',
                description: 'The dessert wizard. Making dentists nervously rich since your first sugar rush!',
                category: 'EXPERTISE',
                rarity: 'RARE',
                assetPath: 'badges/sweet-master.svg',
                requirements: [
                    'Create 12 dessert recipes',
                    'Master 5 complex desserts',
                    'Perfect 6 dessert types',
                    'Maintain 80% success rate',
                    'Create 4 custom variations'
                ],
                xpReward: 150,
                order: 9
            },
            {
                key: 'spice-master',
                name: 'Spice Master',
                description: 'The spice whisperer. Making taste buds dance since your first cayenne mistake!',
                category: 'EXPERTISE',
                rarity: 'LEGENDARY',
                assetPath: 'badges/spice-master.svg',
                requirements: [
                    'Complete 15 spiced recipes',
                    'Use 12 different spices',
                    'Create 8 spice combinations',
                    'Master 5 spiced cuisines',
                    'Develop 3 custom spice blends'
                ],
                xpReward: 200,
                order: 10
            },
            {
                key: 'survivalist-chef',
                name: 'Survivalist Chef',
                description: 'The minimalist maestro. Making masterpieces with fewer ingredients than you have fingers!',
                category: 'EFFICIENCY',
                rarity: 'UNCOMMON',
                assetPath: 'badges/survivalist-chef.svg',
                requirements: [
                    'Complete 3 meals with less than 6 ingredients',
                    'Maintain 80% success rate',
                    'Use at least 2 different recipes',
                    'Complete recipes within estimated time'
                ],
                xpReward: 75,
                order: 11
            }
        ];

        // Upsert all badges
        await Promise.all(defaultBadges.map(badge => 
            Badge.findOneAndUpdate(
                { key: badge.key },
                badge,
                { upsert: true, new: true }
            )
        ));

        console.log('Default badges created/updated');

        // Get all active badges
        const badges = await Badge.find({ isActive: true });

        // Get all users
        const users = await User.find();

        // Initialize progress for each user
        for (const user of users) {
            console.log(`Processing user ${user.email}`);

            // Get existing progress records
            const existingProgress = await UserBadgeProgress.find({
                userId: user._id
            });

            // Create missing progress records
            const existingBadgeIds = existingProgress.map(p => 
                p.badgeId.toString()
            );

            const newProgressRecords = badges
                .filter(badge => !existingBadgeIds.includes(badge._id.toString()))
                .map(badge => ({
                    userId: user._id,
                    badgeId: badge._id,
                    status: BadgeStatus.VISIBLE,
                    progress: 0,
                    milestones: [],
                    lastUpdated: new Date()
                }));

            if (newProgressRecords.length > 0) {
                await UserBadgeProgress.insertMany(newProgressRecords);
                console.log(`Created ${newProgressRecords.length} new progress records for ${user.email}`);
            }
        }

        console.log('Badge progress initialization completed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initializeBadges();
}