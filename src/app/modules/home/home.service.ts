import { Category } from '../category/category.model'
import { PipelineStage } from 'mongoose'
import { ICategory } from '../category/category.interface'
import { IService } from '../service/service.interface'
import { IRecentlyViewed } from '../recentlyViewed/recentlyViewed.interface'
import { IProjectIdea } from '../projectIdea/projectIdea.interface'
import { IProfessionalProfile } from '../professionalProfile/professionalProfile.interface'
import { Service } from '../service/service.model'
import { RecentlyViewed } from '../recentlyViewed/recentlyViewed.model'
import { ProjectIdea } from '../projectIdea/projectIdea.model'
import { ProfessionalProfile } from '../professionalProfile/professionalProfile.model'
import { SERVICE_STATUS } from '../../../enum/service'
import { IHomeData } from './home.interface'
import { User } from '../user/user.model'
import { Availability } from '../availability/availability.model'
import { USER_ROLES } from '../../../enum/user'

const getHomeData = async (userId?: string): Promise<IHomeData> => {
  // Section 2: Recently Viewed
  let recentlyViewed: IRecentlyViewed[] = []
  let userLocation: any = null

  if (userId) {
    const user = await User.findById(userId).select('location').lean()
    userLocation = user?.location

    recentlyViewed = (await RecentlyViewed.find({ userId })
      .populate({
        path: 'serviceId',
        populate: [
          { path: 'providerId', select: 'name fullName profile isOnline' },
          { path: 'category', select: 'name image icon theme' },
        ],
      })
      .sort({ viewedAt: -1 })
      .limit(10)) as unknown as IRecentlyViewed[]
  }

  if (recentlyViewed.length === 0) {
    const fallbackServices = await Service.find()
      .populate('providerId', 'name fullName profile isOnline')
      .populate('category', 'name image icon theme')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()

    recentlyViewed = fallbackServices.map(service => ({
      _id: service._id,
      serviceId: service,
      userId: userId || null,
      viewedAt: new Date(),
    })) as unknown as IRecentlyViewed[]
  }

  // Find distinct category IDs that have at least one active service
  const activeServiceCategoryIds = await Service.distinct('category', {
    status: SERVICE_STATUS.ACTIVE,
  })

  // Section 3: Main Categories
  let mainCategories = (await Category.find({
    _id: { $in: activeServiceCategoryIds },
    isPopular: true,
    isActive: true,
    type: 'category',
  }).limit(12)) as unknown as ICategory[]

  if (mainCategories.length === 0) {
    mainCategories = (await Category.find({
      _id: { $in: activeServiceCategoryIds },
    }).limit(12)) as unknown as ICategory[]
  }

  // Section 4: Trending This Week (Services)
  let trendingThisWeek = (await Service.find({
    status: SERVICE_STATUS.ACTIVE,
    isActive: true,
  })
    .populate('providerId', 'name fullName profile isOnline')
    .populate('category', 'name image icon theme')
    .sort({ createdAt: 1 }) // Or you can sort by viewCount/rating if available
    .limit(8)
    .lean()) as unknown as IService[]

  if (trendingThisWeek.length === 0) {
    trendingThisWeek = (await Service.find()
      .populate('providerId', 'name fullName profile isOnline')
      .populate('category', 'name image icon theme')
      .sort({ createdAt: 1 })
      .limit(8)
      .lean()) as unknown as IService[]
  }

  // Section 5: Available Right Now
  const onlineUsers = await User.find({ isOnline: true }).select('_id').lean()
  const quickResProfiles = await ProfessionalProfile.find({
    responseTime: { $lte: 120 },
  })
    .select('user')
    .lean()
  const expressProfiles = await ProfessionalProfile.find({
    deliveryRate: { $gte: 95 },
  })
    .select('user')
    .lean()

  const weekendAvailability = await Availability.find({
    $or: [
      { 'defaultSchedule.saturday.isActive': true },
      { 'defaultSchedule.sunday.isActive': true },
    ],
  })
    .select('providerId')
    .lean()

  const lastMinuteAvailability = await Availability.find({
    advanceNoticeHours: { $lte: 4 },
  })
    .select('providerId')
    .lean()

  const availableNowCounts = {
    online: onlineUsers.length,
    quickResponse: quickResProfiles.length,
    expressDelivery: expressProfiles.length,
    thisWeekend: weekendAvailability.length,
    lastMinute: lastMinuteAvailability.length,
  }

  const availableUserIds = Array.from(
    new Set([
      ...onlineUsers.map(u => u._id.toString()),
      ...quickResProfiles.map(p => p.user.toString()),
    ]),
  )

  const availableNow = (await ProfessionalProfile.find({
    user: { $in: availableUserIds },
  })
    .populate('user', 'name fullName profile isOnline lastActive')
    .limit(10)
    .lean()) as unknown as IProfessionalProfile[]

  let availableNowFiltered = availableNow
  if (availableNowFiltered.length === 0) {
    availableNowFiltered = (await ProfessionalProfile.find()
      .populate('user', 'name fullName profile isOnline lastActive')
      .limit(3)) as unknown as IProfessionalProfile[]
  }

  // Section 6: Super Pros
  let superPros = (await ProfessionalProfile.find({ isSuperPro: true })
    .populate('user', 'name fullName profile isOnline')
    .select(
      'user rating reviewCount projects specialties isVerified primaryDomain isSuperPro',
    )
    .sort({ rating: -1, projects: -1 })
    .limit(10)) as unknown as IProfessionalProfile[]

  if (superPros.length === 0) {
    superPros = (await ProfessionalProfile.find()
      .populate('user', 'name fullName profile isOnline')
      .select(
        'user rating reviewCount projects specialties isVerified primaryDomain isSuperPro',
      )
      .sort({ rating: -1, projects: -1 })
      .limit(3)) as unknown as IProfessionalProfile[]
  }

  // Find distinct subcategory IDs that have at least one active service
  const activeServiceSubCategoryIds = await Service.distinct('subCategory', {
    status: SERVICE_STATUS.ACTIVE,
  })

  // Section 8: Creative Styles (Subcategories)
  let creativeStyles = await Category.find({
    _id: { $in: activeServiceSubCategoryIds },
    type: 'subcategory',
    isActive: true,
  })
    .select('name theme description image')
    .limit(10)
    .lean()

  if (creativeStyles.length === 0) {
    creativeStyles = (await Category.find({
      _id: { $in: activeServiceSubCategoryIds },
      type: 'subcategory',
    })
      .select('name theme description image')
      .limit(8)
      .lean()) as any
  }

  // Section 9: Near You (Dynamic from DB)
  let nearYou: any[] = []

  // Default placeholder in case no service cover media is found
  const PLACEHOLDER_CITY_IMAGE =
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07' // High-quality photography image

  if (
    userLocation &&
    userLocation.coordinates &&
    userLocation.coordinates[0] !== 0
  ) {
    const nearMePipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: userLocation,
          distanceField: 'dist.calculated',
          maxDistance: 500000, // 500km
          query: { roles: USER_ROLES.PROFESSIONAL },
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
      { $sort: { count: -1 as const } },
      { $limit: 6 },
    ]

    const cities = await User.aggregate(nearMePipeline)

    for (const city of cities) {
      // Trying to get a real work sample from that city
      const service = await Service.findOne({
        'location.city': city._id,
        isActive: true,
      })
        .select('coverMedia')
        .lean()
      nearYou.push({
        town: city._id,
        count: city.count,
        image: service?.coverMedia || PLACEHOLDER_CITY_IMAGE,
      })
    }
  }

  if (nearYou.length === 0) {
    // Fallback: Show any cities from DB that have professionals
    const fallbackPipeline: PipelineStage[] = [
      {
        $match: {
          roles: USER_ROLES.PROFESSIONAL,
          'address.city': { $ne: null },
        },
      },
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 as const } },
      { $limit: 3 },
    ]
    const cities = await User.aggregate(fallbackPipeline)

    for (const city of cities) {
      const service = await Service.findOne({
        'location.city': city._id,
        isActive: true,
      })
        .select('coverMedia')
        .lean()
      nearYou.push({
        town: city._id,
        count: city.count,
        image: service?.coverMedia || PLACEHOLDER_CITY_IMAGE,
      })
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
    ]
  }

  // Section: Original Projects
  let originalProjects = (await Service.find({
    isOriginal: true,
    status: SERVICE_STATUS.ACTIVE,
    isActive: true,
  })
    .populate('providerId', 'name fullName profile isOnline')
    .populate('category', 'name image icon theme')
    .limit(10)
    .lean()) as unknown as IService[]

  if (originalProjects.length === 0) {
    originalProjects = (await Service.find()
      .populate('providerId', 'name fullName profile isOnline')
      .populate('category', 'name image icon theme')
      .limit(10)
      .lean()) as unknown as IService[]
  }

  // Section 10: Ideas
  let ideas = (await ProjectIdea.find()
    .populate('subCategoryId')
    .sort({ order: 1 })
    .limit(6)
    .lean()) as unknown as IProjectIdea[]

  // Fallback Section 10: If ProjectIdea collection is empty, get 3 services as related demo data from DB
//   if (ideas.length === 0) {
//     const fallbackServices = await Service.find({
//       status: SERVICE_STATUS.ACTIVE,
//       isActive: true,
//     })
//       .limit(3)
//       .select('title description coverMedia')
//       .lean()

//     ideas = fallbackServices.map((s, index) => ({
//       _id: s._id,
//       title: s.title,
//       linkText: s.title,
//       subCategoryId: null as any,
//       order: index,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     })) as any
//   }

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
  }
}

export const HomeServices = {
  getHomeData,
}
