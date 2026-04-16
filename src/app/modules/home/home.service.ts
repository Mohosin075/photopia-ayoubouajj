import { Category } from '../category/category.model'
import { Service } from '../service/service.model'
import { RecentlyViewed } from '../recentlyViewed/recentlyViewed.model'
import { Inspiration } from '../inspiration/inspiration.model'
import { ProfessionalProfile } from '../professionalProfile/professionalProfile.model'
import { SERVICE_STATUS } from '../../../enum/service'
import { IHomeData } from './home.interface'
import { User } from '../user/user.model'

const getHomeData = async (userId?: string): Promise<IHomeData> => {
    // Section 2: Recently Viewed
    let recentlyViewed: any = []
    let userLocation: any = null
    
    if (userId) {
        const user = await User.findById(userId).select('location').lean()
        userLocation = user?.location
        
        recentlyViewed = await RecentlyViewed.find({ userId })
            .populate({
                path: 'serviceId',
                populate: [
                    { path: 'providerId', select: 'name fullName profile isOnline' },
                    { path: 'category', select: 'name image icon theme' },
                ],
            })
            .sort({ viewedAt: -1 })
            .limit(10)
    }

    // Section 3: Main Categories (Popular)
    // ... rest of the code ...
    const popularCategories = await Category.find({ 
        isPopular: true, 
        isActive: true,
        type: 'category'
    }).limit(12)

    // Section 4: Trending Projects (Trending Subcategories)
    const trendingSubcategories = await Category.find({
        isTrending: true,
        isActive: true,
        type: 'subcategory'
    }).limit(6)

    // Section 5: Available Right Now
    // Criteria: Online users or Quick Response
    const onlineUsers = await User.find({ isOnline: true }).select('_id').lean()
    const quickResProfiles = await ProfessionalProfile.find({ responseTime: { $lte: 120 } }).select('user').lean()
    const availableUserIds = Array.from(new Set([
        ...onlineUsers.map(u => u._id.toString()),
        ...quickResProfiles.map(p => p.user.toString())
    ]))

    const availableNow = await Service.find({
        status: SERVICE_STATUS.ACTIVE,
        isActive: true,
        providerId: { $in: availableUserIds }
    })
    .populate({
        path: 'providerId',
        select: 'name fullName profile isOnline lastActive'
    })
    .limit(10)
    .lean()

    const availableNowFiltered = availableNow as any

    // Section 6: Super Pros
    // ...
    const superPros = await ProfessionalProfile.find({ isSuperPro: true })
        .populate('user', 'name fullName profile isOnline')
        .limit(5) as any

    // Section 8: By Creative Style (Theme-based)
    // We can return unique themes from categories
    const styles = await Category.distinct('theme', { theme: { $ne: null }, isActive: true }) as string[]
    
    // Section 9: By Location
    // This could be dynamic based on user location, but for now return popular cities
    let popularLocations: any[] = []
    
    if (userLocation && userLocation.coordinates) {
        // If user location is available, we could show nearby services grouped by city
        // For simplicity, let's just use city-based grouping but we could also do geo-query
        popularLocations = await Service.aggregate([
            { $match: { status: SERVICE_STATUS.ACTIVE, isActive: true } },
            { $group: { 
                _id: "$location.city", 
                count: { $sum: 1 },
                image: { $first: "$coverMedia" }
            } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ])
    } else {
        popularLocations = await Service.aggregate([
            { $match: { status: SERVICE_STATUS.ACTIVE, isActive: true } },
            { $group: { 
                _id: "$location.city", 
                count: { $sum: 1 },
                image: { $first: "$coverMedia" }
            } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ])
    }

    // Section: Original Projects
    const originalProjects = await Service.find({
        // TODO : NEED TO UNCOMMENTS
        // isOriginal: true,
        status: SERVICE_STATUS.ACTIVE,
        isActive: true
    })
    .populate('providerId', 'name fullName profile isOnline')
    .populate('category', 'name image icon theme')
    .limit(10)
    .lean() as any

    // Section 10: Inspirations
    const inspirations = await Inspiration.find().limit(6) as any

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
    }
}

export const HomeServices = {
    getHomeData
}
