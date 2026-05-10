"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeServices = void 0;
const category_model_1 = require("../category/category.model");
const service_model_1 = require("../service/service.model");
const recentlyViewed_model_1 = require("../recentlyViewed/recentlyViewed.model");
const inspiration_model_1 = require("../inspiration/inspiration.model");
const professionalProfile_model_1 = require("../professionalProfile/professionalProfile.model");
const service_1 = require("../../../enum/service");
const user_model_1 = require("../user/user.model");
const getHomeData = async (userId) => {
    // Section 2: Recently Viewed
    let recentlyViewed = [];
    let userLocation = null;
    if (userId) {
        const user = await user_model_1.User.findById(userId).select('location').lean();
        userLocation = user === null || user === void 0 ? void 0 : user.location;
        recentlyViewed = await recentlyViewed_model_1.RecentlyViewed.find({ userId })
            .populate({
            path: 'serviceId',
            populate: [
                { path: 'providerId', select: 'name fullName profile isOnline' },
                { path: 'category', select: 'name image icon theme' },
            ],
        })
            .sort({ viewedAt: -1 })
            .limit(10);
    }
    // Section 3: Main Categories (Popular)
    // ... rest of the code ...
    const popularCategories = await category_model_1.Category.find({
        isPopular: true,
        isActive: true,
        type: 'category'
    }).limit(12);
    // Section 4: Trending Projects (Trending Subcategories)
    const trendingSubcategories = await category_model_1.Category.find({
        isTrending: true,
        isActive: true,
        type: 'subcategory'
    }).limit(6);
    // Section 5: Available Right Now
    // Criteria: Online users or Quick Response
    const onlineUsers = await user_model_1.User.find({ isOnline: true }).select('_id').lean();
    const quickResProfiles = await professionalProfile_model_1.ProfessionalProfile.find({ responseTime: { $lte: 120 } }).select('user').lean();
    const availableUserIds = Array.from(new Set([
        ...onlineUsers.map(u => u._id.toString()),
        ...quickResProfiles.map(p => p.user.toString())
    ]));
    const availableNow = await service_model_1.Service.find({
        status: service_1.SERVICE_STATUS.ACTIVE,
        isActive: true,
        providerId: { $in: availableUserIds }
    })
        .populate({
        path: 'providerId',
        select: 'name fullName profile isOnline lastActive'
    })
        .limit(10)
        .lean();
    const availableNowFiltered = availableNow;
    // Section 6: Super Pros
    // ...
    const superPros = await professionalProfile_model_1.ProfessionalProfile.find({ isSuperPro: true })
        .populate('user', 'name fullName profile isOnline')
        .limit(5);
    // Section 8: By Creative Style (Theme-based)
    // We can return unique themes from categories
    const styles = await category_model_1.Category.distinct('theme', { theme: { $ne: null }, isActive: true });
    // Section 9: By Location
    // This could be dynamic based on user location, but for now return popular cities
    let popularLocations = [];
    if (userLocation && userLocation.coordinates) {
        // If user location is available, we could show nearby services grouped by city
        // For simplicity, let's just use city-based grouping but we could also do geo-query
        popularLocations = await service_model_1.Service.aggregate([
            { $match: { status: service_1.SERVICE_STATUS.ACTIVE, isActive: true } },
            { $group: {
                    _id: "$location.city",
                    count: { $sum: 1 },
                    image: { $first: "$coverMedia" }
                } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);
    }
    else {
        popularLocations = await service_model_1.Service.aggregate([
            { $match: { status: service_1.SERVICE_STATUS.ACTIVE, isActive: true } },
            { $group: {
                    _id: "$location.city",
                    count: { $sum: 1 },
                    image: { $first: "$coverMedia" }
                } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);
    }
    // Section: Original Projects
    const originalProjects = await service_model_1.Service.find({
        // TODO : NEED TO UNCOMMENTS
        // isOriginal: true,
        status: service_1.SERVICE_STATUS.ACTIVE,
        isActive: true
    })
        .populate('providerId', 'name fullName profile isOnline')
        .populate('category', 'name image icon theme')
        .limit(10)
        .lean();
    // Section 10: Inspirations
    const inspirations = await inspiration_model_1.Inspiration.find().limit(6);
    return {
        recentlyViewed,
        popularCategories,
        trendingSubcategories,
        availableNow: availableNowFiltered,
        superPros,
        styles,
        popularLocations,
        originalProjects,
        inspirations
    };
};
exports.HomeServices = {
    getHomeData
};
