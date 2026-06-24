"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeServices = void 0;
const category_model_1 = require("../category/category.model");
const service_model_1 = require("../service/service.model");
const recentlyViewed_model_1 = require("../recentlyViewed/recentlyViewed.model");
const projectIdea_model_1 = require("../projectIdea/projectIdea.model");
const professionalProfile_model_1 = require("../professionalProfile/professionalProfile.model");
const service_1 = require("../../../enum/service");
const user_model_1 = require("../user/user.model");
const availability_model_1 = require("../availability/availability.model");
const user_1 = require("../../../enum/user");
const getHomeData = async (userId) => {
    // Section 2: Recently Viewed
    let recentlyViewed = [];
    let userLocation = null;
    if (userId) {
        const user = await user_model_1.User.findById(userId).select('location').lean();
        userLocation = user === null || user === void 0 ? void 0 : user.location;
        recentlyViewed = (await recentlyViewed_model_1.RecentlyViewed.find({ userId })
            .populate({
            path: 'serviceId',
            populate: [
                { path: 'providerId', select: 'name fullName profile isOnline' },
                { path: 'category', select: 'name image icon theme' },
            ],
        })
            .sort({ viewedAt: -1 })
            .limit(10));
    }
    if (recentlyViewed.length === 0) {
        recentlyViewed = (await recentlyViewed_model_1.RecentlyViewed.find()
            .populate({
            path: 'serviceId',
            populate: [
                { path: 'providerId', select: 'name fullName profile isOnline' },
                { path: 'category', select: 'name image icon theme' },
            ],
        })
            .sort({ viewedAt: -1 })
            .limit(3));
    }
    // Section 3: Main Categories
    let mainCategories = (await category_model_1.Category.find({
        isPopular: true,
        isActive: true,
        type: 'category',
    }).limit(12));
    if (mainCategories.length === 0) {
        mainCategories = (await category_model_1.Category.find({
            isActive: true,
            type: 'category',
        }).limit(3));
    }
    // Section 4: Trending This Week
    let trendingThisWeek = (await category_model_1.Category.find({
        isTrending: true,
        isActive: true,
        type: 'subcategory',
    }).limit(6));
    if (trendingThisWeek.length === 0) {
        trendingThisWeek = (await category_model_1.Category.find({
            isActive: true,
            type: 'subcategory',
        }).limit(3));
    }
    // Section 5: Available Right Now
    const onlineUsers = await user_model_1.User.find({ isOnline: true }).select('_id').lean();
    const quickResProfiles = await professionalProfile_model_1.ProfessionalProfile.find({
        responseTime: { $lte: 120 },
    })
        .select('user')
        .lean();
    const expressProfiles = await professionalProfile_model_1.ProfessionalProfile.find({
        deliveryRate: { $gte: 95 },
    })
        .select('user')
        .lean();
    const weekendAvailability = await availability_model_1.Availability.find({
        $or: [
            { 'defaultSchedule.saturday.isActive': true },
            { 'defaultSchedule.sunday.isActive': true },
        ],
    })
        .select('providerId')
        .lean();
    const lastMinuteAvailability = await availability_model_1.Availability.find({
        advanceNoticeHours: { $lte: 4 },
    })
        .select('providerId')
        .lean();
    const availableNowCounts = {
        online: onlineUsers.length,
        quickResponse: quickResProfiles.length,
        expressDelivery: expressProfiles.length,
        thisWeekend: weekendAvailability.length,
        lastMinute: lastMinuteAvailability.length,
    };
    const availableUserIds = Array.from(new Set([
        ...onlineUsers.map(u => u._id.toString()),
        ...quickResProfiles.map(p => p.user.toString()),
    ]));
    const availableNow = (await professionalProfile_model_1.ProfessionalProfile.find({
        user: { $in: availableUserIds },
    })
        .populate('user', 'name fullName profile isOnline lastActive')
        .limit(10)
        .lean());
    let availableNowFiltered = availableNow;
    if (availableNowFiltered.length === 0) {
        availableNowFiltered = (await professionalProfile_model_1.ProfessionalProfile.find()
            .populate('user', 'name fullName profile isOnline lastActive')
            .limit(3));
    }
    // Section 6: Super Pros
    let superPros = (await professionalProfile_model_1.ProfessionalProfile.find({ isSuperPro: true })
        .populate('user', 'name fullName profile isOnline')
        .select('user rating reviewCount projects specialties isVerified primaryDomain isSuperPro')
        .sort({ rating: -1, projects: -1 })
        .limit(10));
    if (superPros.length === 0) {
        superPros = (await professionalProfile_model_1.ProfessionalProfile.find()
            .populate('user', 'name fullName profile isOnline')
            .select('user rating reviewCount projects specialties isVerified primaryDomain isSuperPro')
            .sort({ rating: -1, projects: -1 })
            .limit(3));
    }
    // Section 8: Creative Styles
    let creativeStyles = await category_model_1.Category.find({
        theme: { $ne: null },
        isActive: true,
    })
        .select('name theme description image')
        .limit(10)
        .lean();
    if (creativeStyles.length === 0) {
        creativeStyles = (await category_model_1.Category.find({ isActive: true })
            .select('name theme description image')
            .limit(3)
            .lean());
    }
    // Section 9: Near You (Dynamic from DB)
    let nearYou = [];
    // Default placeholder in case no service cover media is found
    const PLACEHOLDER_CITY_IMAGE = 'https://images.unsplash.com/photo-1493863641943-9b68992a8d07'; // High-quality photography image
    if (userLocation &&
        userLocation.coordinates &&
        userLocation.coordinates[0] !== 0) {
        const nearMePipeline = [
            {
                $geoNear: {
                    near: userLocation,
                    distanceField: 'dist.calculated',
                    maxDistance: 500000, // 500km
                    query: { roles: user_1.USER_ROLES.PROFESSIONAL },
                    spherical: true,
                },
            },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 },
                },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
        ];
        const cities = await user_model_1.User.aggregate(nearMePipeline);
        for (const city of cities) {
            // Trying to get a real work sample from that city
            const service = await service_model_1.Service.findOne({
                'location.city': city._id,
                isActive: true,
            })
                .select('coverMedia')
                .lean();
            nearYou.push({
                town: city._id,
                count: city.count,
                image: (service === null || service === void 0 ? void 0 : service.coverMedia) || PLACEHOLDER_CITY_IMAGE,
            });
        }
    }
    if (nearYou.length === 0) {
        // Fallback: Show any cities from DB that have professionals
        const fallbackPipeline = [
            {
                $match: {
                    roles: user_1.USER_ROLES.PROFESSIONAL,
                    'address.city': { $ne: null },
                },
            },
            {
                $group: {
                    _id: '$address.city',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 3 },
        ];
        const cities = await user_model_1.User.aggregate(fallbackPipeline);
        for (const city of cities) {
            const service = await service_model_1.Service.findOne({
                'location.city': city._id,
                isActive: true,
            })
                .select('coverMedia')
                .lean();
            nearYou.push({
                town: city._id,
                count: city.count,
                image: (service === null || service === void 0 ? void 0 : service.coverMedia) || PLACEHOLDER_CITY_IMAGE,
            });
        }
    }
    // Final Fallback: If DB is completely empty of professionals, show demo data from document
    if (nearYou.length === 0) {
        nearYou = [
            {
                town: 'Paris',
                count: 1247,
                image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
            },
            {
                town: 'Lyon',
                count: 423,
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
            },
            {
                town: 'Nice',
                count: 187,
                image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047',
            },
        ];
    }
    // Section: Original Projects
    let originalProjects = (await service_model_1.Service.find({
        isOriginal: true,
        status: service_1.SERVICE_STATUS.ACTIVE,
        isActive: true,
    })
        .populate('providerId', 'name fullName profile isOnline')
        .populate('category', 'name image icon theme')
        .limit(10)
        .lean());
    if (originalProjects.length === 0) {
        originalProjects = (await service_model_1.Service.find({
            status: service_1.SERVICE_STATUS.ACTIVE,
            isActive: true,
        })
            .populate('providerId', 'name fullName profile isOnline')
            .populate('category', 'name image icon theme')
            .limit(3)
            .lean());
    }
    // Section 10: Ideas
    let ideas = (await projectIdea_model_1.ProjectIdea.find()
        .populate('subCategoryId')
        .sort({ order: 1 })
        .limit(6)
        .lean());
    // Fallback Section 10: If ProjectIdea collection is empty, get 3 services as related demo data from DB
    if (ideas.length === 0) {
        const fallbackServices = await service_model_1.Service.find({
            status: service_1.SERVICE_STATUS.ACTIVE,
            isActive: true,
        })
            .limit(3)
            .select('title description coverMedia')
            .lean();
        ideas = fallbackServices.map((s, index) => ({
            _id: s._id,
            title: s.title,
            linkText: s.title,
            subCategoryId: null,
            order: index,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    }
    return {
        originalProjects,
        recentlyViewed,
        mainCategories,
        trendingThisWeek,
        availableNow: availableNowFiltered,
        superPros,
        creativeStyles,
        nearYou,
        ideas,
        availableNowCounts: availableNowCounts,
    };
};
exports.HomeServices = {
    getHomeData,
};
