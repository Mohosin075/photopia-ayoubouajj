"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalProfileServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const professionalProfile_model_1 = require("./professionalProfile.model");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enum/user");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const config_1 = __importDefault(require("../../../config"));
const booking_model_1 = require("../booking/booking.model");
const mongoose_1 = require("mongoose");
const exceljs_1 = __importDefault(require("exceljs"));
const analytics_service_1 = require("../analytics/analytics.service");
/**
 * Helper to calculate percentage change between two values
 */
const calculateChange = (current, previous) => {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
};
const createProfile = async (userId, payload) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    const existingProfile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId });
    if (existingProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Professional profile already exists');
    }
    const result = await professionalProfile_model_1.ProfessionalProfile.create({
        ...payload,
        user: new mongoose_1.Types.ObjectId(userId),
    });
    // Add PROFESSIONAL role to user if not already present
    if (!user.roles.includes(user_1.USER_ROLES.PROFESSIONAL)) {
        await user_model_1.User.findByIdAndUpdate(userId, {
            $addToSet: { roles: user_1.USER_ROLES.PROFESSIONAL },
        });
    }
    return result;
};
const getProfile = async (userId) => {
    var _a, _b, _c;
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId }).populate('user');
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    // Get Booking Stats
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const [thisWeekBookings, thisMonthStats, lastMonthStats] = await Promise.all([
        booking_model_1.Booking.countDocuments({
            providerId: new mongoose_1.Types.ObjectId(userId),
            createdAt: { $gte: currentWeekStart },
        }),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: currentMonthStart },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
                    totalBookings: { $sum: 1 },
                },
            },
        ]),
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ]),
    ]);
    const calculateChangeValue = (current, previous) => {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(2));
    };
    const currentMonthRevenue = ((_a = thisMonthStats[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const lastMonthRevenue = ((_b = lastMonthStats[0]) === null || _b === void 0 ? void 0 : _b.totalRevenue) || 0;
    const totalBookingsCount = ((_c = thisMonthStats[0]) === null || _c === void 0 ? void 0 : _c.totalBookings) || 0;
    return {
        ...profile.toObject(),
        statistics: {
            bookings: {
                count: totalBookingsCount,
                thisWeek: thisWeekBookings,
            },
            revenue: {
                amount: currentMonthRevenue,
                percentageChange: calculateChangeValue(currentMonthRevenue, lastMonthRevenue),
            },
        },
    };
};
const updateProfile = async (userId, payload) => {
    const existingProfile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId });
    if (!existingProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    // Append new portfolio items instead of overwriting
    if (payload.portfolio && Array.isArray(payload.portfolio)) {
        payload.portfolio = [...(existingProfile.portfolio || []), ...payload.portfolio];
    }
    // Append new specialties instead of overwriting (optional, but good for consistency)
    if (payload.specialties && Array.isArray(payload.specialties)) {
        payload.specialties = [
            ...new Set([...(existingProfile.specialties || []), ...payload.specialties]),
        ];
    }
    // Append new language instead of overwriting (optional, but good for consistency)
    if (payload.language && Array.isArray(payload.language)) {
        payload.language = [
            ...new Set([...(existingProfile.language || []), ...payload.language]),
        ];
    }
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOneAndUpdate({ user: userId }, payload, { new: true });
    return profile;
};
const removeItem = async (userId, payload) => {
    const { field, values } = payload;
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOneAndUpdate({ user: userId }, { $pullAll: { [field]: values } }, { new: true });
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    return profile;
};
const stripeConnectOnboarding = async (userId) => {
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId }).populate('user');
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    let stripeAccountId = profile.stripeAccountId;
    if (!stripeAccountId) {
        // Create a new Stripe Express account
        const account = await stripe_1.default.accounts.create({
            type: 'express',
            email: profile.user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        stripeAccountId = account.id;
        profile.stripeAccountId = stripeAccountId;
        await profile.save();
    }
    // Generate onboarding link
    const accountLink = await stripe_1.default.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${config_1.default.clientUrl}/expired`,
        return_url: `${config_1.default.clientUrl}`,
        // refresh_url: `${config.clientUrl}/stripe-connect/refresh`,
        // return_url: `${config.clientUrl}/stripe-connect/return`,
        type: 'account_onboarding',
    });
    return {
        url: accountLink.url,
    };
};
const checkStripeAccountStatus = async (userId) => {
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId });
    if (!profile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    }
    if (!profile.stripeAccountId) {
        return { isComplete: false };
    }
    const account = await stripe_1.default.accounts.retrieve(profile.stripeAccountId);
    if (account.details_submitted && !profile.stripeOnboardingComplete) {
        profile.stripeOnboardingComplete = true;
        await profile.save();
    }
    return {
        isComplete: profile.stripeOnboardingComplete,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
    };
};
const getDetailedStatistics = async (userId) => {
    var _a;
    const profile = await professionalProfile_model_1.ProfessionalProfile.findOne({ user: userId }).populate('user').lean();
    if (!profile)
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Professional profile not found');
    const user = profile.user;
    const isPremium = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) === 'active' || (user === null || user === void 0 ? void 0 : user.subscriptionStatus) === 'trialing';
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    // 1. Core Profile Stats (Common for all)
    const categoryAverageViews = 450;
    const viewsPerformance = calculateChange(profile.profileViews || 0, categoryAverageViews);
    const categoryAverageRating = 4.2;
    const ratingPerformance = calculateChange(profile.rating || 0, categoryAverageRating);
    // 2. Data Fetching (Parallelized & Conditional)
    const queries = [
        // Current Month Revenue Stats
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: currentMonthStart },
                },
            },
            {
                $group: {
                    _id: isPremium ? { $week: '$completedAt' } : null,
                    amount: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
            { $sort: { '_id': 1 } }
        ]),
        // Previous Month Revenue Stats
        booking_model_1.Booking.aggregate([
            {
                $match: {
                    providerId: new mongoose_1.Types.ObjectId(userId),
                    status: 'completed',
                    completedAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricingDetails.providerEarnings' },
                },
            },
        ])
    ];
    // Only add heavy premium queries if the user is premium
    if (isPremium) {
        queries.push(analytics_service_1.AnalyticsService.getPremiumAnalytics(userId));
    }
    const [currentMonthData, previousMonthData, premiumMetrics] = await Promise.all(queries);
    // 3. Process Revenue
    const currentMonthRevenue = currentMonthData.reduce((acc, curr) => acc + curr.amount, 0);
    const previousMonthRevenue = ((_a = previousMonthData[0]) === null || _a === void 0 ? void 0 : _a.totalRevenue) || 0;
    const revenueChange = calculateChange(currentMonthRevenue, previousMonthRevenue);
    const formattedWeeklyRevenue = isPremium
        ? currentMonthData.map((w, index) => ({
            week: `Week ${index + 1}`,
            amount: w.amount
        }))
        : [];
    // 4. Final Response Construction
    const response = {
        isPremium,
        profileViews: {
            count: profile.profileViews || 0,
            change: -8, // Weekly trend (mocked for now)
            performanceVsCategory: {
                categoryAverage: categoryAverageViews,
                percentageAbove: viewsPerformance
            }
        },
        rating: {
            score: profile.rating || 0,
            reviews: profile.reviewCount || 0,
            performanceVsCategory: {
                categoryAverage: categoryAverageRating,
                percentageHigher: ratingPerformance
            }
        },
        revenueAnalytics: {
            currentMonth: currentMonthRevenue,
            previousMonth: previousMonthRevenue,
            percentageChange: revenueChange,
            averagePerPeriod: currentMonthRevenue / 4,
            bestPerforming: isPremium && formattedWeeklyRevenue.length > 0
                ? Math.max(...formattedWeeklyRevenue.map((w) => w.amount))
                : 0,
            weeklyBreakdown: formattedWeeklyRevenue // Only populated if premium
        }
    };
    if (isPremium) {
        response.viewsByRegion = [
            { city: 'New York, NY', percentage: 37.5, count: 450 },
            { city: 'Los Angeles, CA', percentage: 23.3, count: 280 },
            { city: 'Chicago, IL', percentage: 15.4, count: 185 },
            { city: 'Miami, FL', percentage: 12.1, count: 145 },
            { city: 'Boston, MA', percentage: 7.5, count: 90 },
            { city: 'Other', percentage: 4.2, count: 50 },
        ];
        response.premiumMetrics = premiumMetrics;
    }
    return response;
};
const exportStatisticsReport = async (userId) => {
    const stats = await getDetailedStatistics(userId);
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet('Statistics Report');
    worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
        { header: 'Details', key: 'details', width: 40 },
    ];
    // Add Overview
    worksheet.addRow({ metric: 'Profile Views', value: stats.profileViews.count, details: `${stats.profileViews.change}% this week` });
    worksheet.addRow({ metric: 'Rating', value: stats.rating.score, details: `${stats.rating.reviews} reviews` });
    worksheet.addRow({});
    // Add Revenue
    worksheet.addRow({ metric: 'Current Month Revenue', value: `€${stats.revenueAnalytics.currentMonth}`, details: `${stats.revenueAnalytics.percentageChange}% vs previous month` });
    stats.revenueAnalytics.weeklyBreakdown.forEach((w) => {
        worksheet.addRow({ metric: w.week, value: `€${w.amount}` });
    });
    worksheet.addRow({});
    // Add Regions
    if (stats.viewsByRegion && Array.isArray(stats.viewsByRegion)) {
        worksheet.addRow({ metric: 'Region', value: 'Views', details: 'Percentage' });
        stats.viewsByRegion.forEach((r) => {
            worksheet.addRow({ metric: r.city, value: r.count, details: `${r.percentage}%` });
        });
    }
    // Style header
    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
};
exports.ProfessionalProfileServices = {
    createProfile,
    getProfile,
    updateProfile,
    removeItem,
    stripeConnectOnboarding,
    checkStripeAccountStatus,
    getDetailedStatistics,
    exportStatisticsReport,
};
