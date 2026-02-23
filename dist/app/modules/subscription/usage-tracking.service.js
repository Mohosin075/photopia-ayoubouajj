"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageTrackingService = void 0;
const mongoose_1 = require("mongoose");
const subscription_model_1 = require("./subscription.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
class UsageTrackingService {
    // Check if user can add more trucks
    async canAddTruck(userId) {
        try {
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            }).populate('planId');
            if (!subscription) {
                return { allowed: false, reason: 'No active subscription' };
            }
            // Ensure planId is populated, if not fetch it separately
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'name' in subscription.planId &&
                'maxTrucks' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                // Fallback: fetch the plan separately if not populated
                const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            // Get current truck count (you'd implement this based on your truck model)
            const currentTruckCount = await this.getCurrentTruckCount(userId);
            if (currentTruckCount >= plan.maxTrucks) {
                return {
                    allowed: false,
                    reason: `Plan limit reached. Your ${plan.name} plan allows ${plan.maxTrucks} trucks.`
                };
            }
            return { allowed: true };
        }
        catch (error) {
            console.error('Error checking truck limit:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to check truck limit');
        }
    }
    // Check if user can add more team members
    async canAddUser(userId) {
        try {
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            }).populate('planId');
            if (!subscription) {
                return { allowed: false, reason: 'No active subscription' };
            }
            // Ensure planId is populated, if not fetch it separately
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'name' in subscription.planId &&
                'maxUsers' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                // Fallback: fetch the plan separately if not populated
                const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            // Get current user count (you'd implement this based on your user model)
            const currentUserCount = await this.getCurrentUserCount(userId);
            if (currentUserCount >= plan.maxUsers) {
                return {
                    allowed: false,
                    reason: `Plan limit reached. Your ${plan.name} plan allows ${plan.maxUsers} users.`
                };
            }
            return { allowed: true };
        }
        catch (error) {
            console.error('Error checking user limit:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to check user limit');
        }
    }
    // Get current usage for a user
    async getCurrentUsage(userId) {
        try {
            const truckCount = await this.getCurrentTruckCount(userId);
            const userCount = await this.getCurrentUserCount(userId);
            return {
                userId,
                truckCount,
                userCount,
                storageUsed: 0, // Implement based on your needs
                apiCallsThisMonth: 0, // Implement based on your needs
            };
        }
        catch (error) {
            console.error('Error getting current usage:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get usage data');
        }
    }
    // Get usage with plan limits
    async getUsageWithLimits(userId) {
        try {
            const subscription = await subscription_model_1.Subscription.findOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                status: { $in: ['active', 'trialing'] },
            }).populate('planId');
            if (!subscription) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No active subscription found');
            }
            // Ensure planId is populated, if not fetch it separately
            let plan;
            if (subscription.planId &&
                typeof subscription.planId === 'object' &&
                'name' in subscription.planId &&
                'maxTrucks' in subscription.planId &&
                'maxUsers' in subscription.planId) {
                plan = subscription.planId;
            }
            else {
                // Fallback: fetch the plan separately if not populated
                const { subscriptionService } = await Promise.resolve().then(() => __importStar(require('./subscription.service')));
                plan = await subscriptionService.getPlanById(subscription.planId.toString());
            }
            const usage = await this.getCurrentUsage(userId);
            return {
                usage,
                limits: {
                    maxTrucks: plan.maxTrucks,
                    maxUsers: plan.maxUsers,
                },
                percentages: {
                    trucksUsed: Math.round((usage.truckCount / plan.maxTrucks) * 100),
                    usersUsed: Math.round((usage.userCount / plan.maxUsers) * 100),
                },
            };
        }
        catch (error) {
            if (error instanceof ApiError_1.default)
                throw error;
            console.error('Error getting usage with limits:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get usage data');
        }
    }
    // Check if user is approaching limits (80% threshold)
    async checkApproachingLimits(userId) {
        try {
            const data = await this.getUsageWithLimits(userId);
            const warnings = [];
            const suggestions = [];
            if (data.percentages.trucksUsed >= 80) {
                warnings.push(`You're using ${data.percentages.trucksUsed}% of your truck limit`);
                suggestions.push('Consider upgrading your plan to add more trucks');
            }
            if (data.percentages.usersUsed >= 80) {
                warnings.push(`You're using ${data.percentages.usersUsed}% of your user limit`);
                suggestions.push('Consider upgrading your plan to add more team members');
            }
            return { warnings, suggestions };
        }
        catch (error) {
            console.error('Error checking approaching limits:', error);
            return { warnings: [], suggestions: [] };
        }
    }
    // Private helper methods (implement based on your data models)
    async getCurrentTruckCount(userId) {
        try {
            // Replace with your actual truck counting logic
            // const count = await Truck.countDocuments({ ownerId: userId, status: 'active' })
            // return count
            // Placeholder implementation
            return 0;
        }
        catch (error) {
            console.error('Error getting truck count:', error);
            return 0;
        }
    }
    async getCurrentUserCount(userId) {
        try {
            // Replace with your actual user counting logic
            // For companies, count team members
            // const count = await User.countDocuments({ companyId: userId, status: 'active' })
            // return count
            // Placeholder implementation
            return 1; // At least the owner
        }
        catch (error) {
            console.error('Error getting user count:', error);
            return 1;
        }
    }
    // Track feature usage (for analytics)
    async trackFeatureUsage(userId, feature) {
        try {
            // Implement feature usage tracking
            console.log(`Feature used: ${feature} by user: ${userId}`);
            // You could store this in a separate collection for analytics
            // await FeatureUsage.create({ userId, feature, timestamp: new Date() })
        }
        catch (error) {
            console.error('Error tracking feature usage:', error);
        }
    }
}
exports.usageTrackingService = new UsageTrackingService();
