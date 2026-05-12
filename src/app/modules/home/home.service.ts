import { Category } from '../category/category.model'
import { ICategory } from '../category/category.interface'
import { IService } from '../service/service.interface'
import { IRecentlyViewed } from '../recentlyViewed/recentlyViewed.interface'
import { IInspiration } from '../inspiration/inspiration.interface'
import { IProfessionalProfile } from '../professionalProfile/professionalProfile.interface'
import { Service } from '../service/service.model'
import { RecentlyViewed } from '../recentlyViewed/recentlyViewed.model'
import { Inspiration } from '../inspiration/inspiration.model'
import { ProfessionalProfile } from '../professionalProfile/professionalProfile.model'
import { SERVICE_STATUS } from '../../../enum/service'
import { IHomeData } from './home.interface'
import { User } from '../user/user.model'

// Demo data for fallbacks
const DEMO_CATEGORIES = [
    { name: 'Portrait', icon: '📸', theme: 'PHOTOGRAPHY', isPopular: true },
    { name: 'Wedding', icon: '💍', theme: 'PHOTOGRAPHY', isPopular: true },
    { name: 'Events', icon: '🎉', theme: 'VIDEOGRAPHY', isPopular: true },
    { name: 'Fashion', icon: '👗', theme: 'PHOTOGRAPHY', isPopular: true },
    { name: 'Corporate', icon: '🏢', theme: 'VIDEOGRAPHY', isPopular: true },
    { name: 'Nature', icon: '🌿', theme: 'PHOTOGRAPHY', isPopular: true },
]

const DEMO_TRENDING = [
    { name: 'TikTok & Reels', theme: 'VIDEOGRAPHY', isTrending: true, trendingBadge: '🔥 TRENDING' },
    { name: 'Drone Shots', theme: 'PHOTOGRAPHY', isTrending: true, trendingBadge: '⚡ POPULAR' },
    { name: 'Product Packshot', theme: 'PHOTOGRAPHY', isTrending: true, trendingBadge: '📈 +45%' },
]

const DEMO_STYLES = ['Cinematic', 'Natural', 'Vintage', 'Modern', 'Minimalist', 'Dramatic']

const DEMO_LOCATIONS = [
    { _id: 'Paris', count: 12, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
    { _id: 'London', count: 8, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad' },
    { _id: 'Berlin', count: 5, image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047' },
    { _id: 'Rome', count: 7, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5' },
]

const DEMO_INSPIRATIONS = [
    { title: 'Planning a wedding?', description: 'See our wedding packages', link: '/packages/wedding', icon: '💒' },
    { title: 'Need social content?', description: 'Social Media Plans', link: '/plans/social', icon: '📱' },
    { title: 'Newborn Session?', description: 'Capturing first moments', link: '/packages/newborn', icon: '👶' },
    { title: 'Corporate Rebrand?', description: 'Professional identity films', link: '/packages/corporate', icon: '🏢' },
]

const DEMO_SERVICES = [
    { 
        _id: 's1',
        title: 'Cinematic Wedding Film', 
        price: 1200, 
        coverMedia: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        providerId: { name: 'John Doe', fullName: 'John Doe', profile: '', isOnline: true },
        category: { name: 'Events', theme: 'PHOTOGRAPHY' }
    },
    { 
        _id: 's2',
        title: 'Professional Corporate Portrait', 
        price: 150, 
        coverMedia: 'https://images.unsplash.com/photo-1560250097-0b93528c311a',
        providerId: { name: 'Jane Smith', fullName: 'Jane Smith', profile: '', isOnline: true },
        category: { name: 'Corporate', theme: 'PHOTOGRAPHY' }
    },
    { 
        _id: 's3',
        title: 'Real Estate Drone Tour', 
        price: 450, 
        coverMedia: 'https://images.unsplash.com/photo-1473177104440-f463f5899c23',
        providerId: { name: 'Mike Drone', fullName: 'Mike Drone', profile: '', isOnline: true },
        category: { name: 'Real Estate', theme: 'VIDEOGRAPHY' }
    },
    { 
        _id: 's4',
        title: 'Artistic Music Video', 
        price: 2500, 
        coverMedia: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9',
        providerId: { name: 'Chris Clip', fullName: 'Chris Clip', profile: '', isOnline: true },
        category: { name: 'Music', theme: 'VIDEOGRAPHY' }
    }
]

const DEMO_RECENTLY_VIEWED = [
    { serviceId: DEMO_SERVICES[0], viewedAt: new Date() },
    { serviceId: DEMO_SERVICES[1], viewedAt: new Date() },
    { serviceId: DEMO_SERVICES[2], viewedAt: new Date() },
]

const DEMO_PROFILES = [
    { 
        rating: 4.9, 
        projects: 25, 
        isSuperPro: true,
        user: { name: 'Alex Creator', fullName: 'Alex Creator', profile: '', isOnline: true } 
    },
    { 
        rating: 4.8, 
        projects: 42, 
        isSuperPro: true,
        user: { name: 'Sarah Photo', fullName: 'Sarah Photo', profile: '', isOnline: true } 
    },
    { 
        rating: 4.7, 
        projects: 15, 
        isSuperPro: true,
        user: { name: 'Tom Video', fullName: 'Tom Video', profile: '', isOnline: true } 
    }
]

const getHomeData = async (userId?: string): Promise<IHomeData> => {
    // Section 2: Recently Viewed
    let recentlyViewed: IRecentlyViewed[] = []
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
            .limit(10) as unknown as IRecentlyViewed[]
    }

    if (recentlyViewed.length === 0) {
        recentlyViewed = DEMO_RECENTLY_VIEWED as unknown as IRecentlyViewed[]
    }

    // Section 3: Main Categories (Popular)
    let popularCategories = await Category.find({ 
        isPopular: true, 
        isActive: true,
        type: 'category'
    }).limit(12) as unknown as ICategory[]
    
    if (popularCategories.length === 0) {
        popularCategories = DEMO_CATEGORIES as unknown as ICategory[]
    }

    // Section 4: Trending Projects (Trending Subcategories)
    let trendingSubcategories = await Category.find({
        isTrending: true,
        isActive: true,
        type: 'subcategory'
    }).limit(6) as unknown as ICategory[]
    
    if (trendingSubcategories.length === 0) {
        trendingSubcategories = DEMO_TRENDING as unknown as ICategory[]
    }

    // Section 5: Available Right Now
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

    let availableNowFiltered = availableNow as unknown as IService[]
    if (availableNowFiltered.length === 0) {
        availableNowFiltered = DEMO_SERVICES as unknown as IService[]
    }

    // Section 6: Super Pros
    let superPros = await ProfessionalProfile.find({ isSuperPro: true })
        .populate('user', 'name fullName profile isOnline')
        .limit(5) as unknown as IProfessionalProfile[]
    
    if (superPros.length === 0) {
        superPros = DEMO_PROFILES as unknown as IProfessionalProfile[]
    }

    // Section 8: By Creative Style (Theme-based)
    let styles = await Category.distinct('theme', { theme: { $ne: null }, isActive: true }) as string[]
    if (styles.length === 0) {
        styles = DEMO_STYLES
    }
    
    // Section 9: By Location
    let popularLocations: any[] = []
    
    const aggregationPipeline = [
        { $match: { status: SERVICE_STATUS.ACTIVE, isActive: true } },
        { $group: { 
            _id: "$location.city", 
            count: { $sum: 1 },
            image: { $first: "$coverMedia" }
        } },
        { $sort: { count: -1 } as const },
        { $limit: 6 }
    ]

    popularLocations = await Service.aggregate(aggregationPipeline)
    
    if (popularLocations.length === 0) {
        popularLocations = DEMO_LOCATIONS
    }

    // Section: Original Projects
    let originalProjects = await Service.find({
        isOriginal: true,
        status: SERVICE_STATUS.ACTIVE,
        isActive: true
    })
    .populate('providerId', 'name fullName profile isOnline')
    .populate('category', 'name image icon theme')
    .limit(10)
    .lean() as unknown as IService[]
    
    if (originalProjects.length === 0) {
        originalProjects = DEMO_SERVICES as unknown as IService[]
    }

    // Section 10: Inspirations
    let inspirations = await Inspiration.find().limit(6) as unknown as IInspiration[]
    if (inspirations.length === 0) {
        inspirations = DEMO_INSPIRATIONS as unknown as IInspiration[]
    }

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
