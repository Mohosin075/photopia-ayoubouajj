import { Types } from 'mongoose'
import { Analytics } from './analytics.model'
import { Booking } from '../booking/booking.model'
import { Service } from '../service/service.model'
import { IPremiumAnalytics } from './analytics.interface'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'

const trackVisit = async (payload: {
  providerId: string
  serviceId?: string
  visitorId: string
  type: 'view' | 'interaction'
  interactionType?: string
}): Promise<void> => {
  await Analytics.create({
    providerId: new Types.ObjectId(payload.providerId),
    serviceId: payload.serviceId ? new Types.ObjectId(payload.serviceId) : undefined,
    visitorId: payload.visitorId,
    type: payload.type,
    interactionType: payload.interactionType,
    timestamp: new Date(),
  })
}

const getPremiumAnalytics = async (providerId: string): Promise<IPremiumAnalytics> => {
  const objectId = new Types.ObjectId(providerId)

  // 1. Most viewed project
  const mostViewed = await Analytics.aggregate([
    { $match: { providerId: objectId, type: 'view', serviceId: { $exists: true } } },
    { $group: { _id: '$serviceId', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service',
      },
    },
    { $unwind: '$service' },
  ])

  // 2. Conversion Rate (Completed Bookings / Total Views)
  const [totalViews, completedBookings] = await Promise.all([
    Analytics.countDocuments({ providerId: objectId, type: 'view' }),
    Booking.countDocuments({ providerId: objectId, status: 'completed' }),
  ])

  const conversionRate = totalViews > 0 ? (completedBookings / totalViews) * 100 : 0

  // 3. Bounce Rate
  // Simplified: A visit is a bounce if it's a 'view' and there's no other interaction from same visitorId within 30 mins
  const totalVisits = await Analytics.distinct('visitorId', { providerId: objectId, type: 'view' })
  const visitorsWithInteractions = await Analytics.distinct('visitorId', {
    providerId: objectId,
    type: 'interaction',
  })
  
  const bounces = totalVisits.length - visitorsWithInteractions.length
  const bounceRate = totalVisits.length > 0 ? (bounces / totalVisits.length) * 100 : 0

  // 4. Avg Revenue vs Category
  const userBookings = await Booking.find({ providerId: objectId, status: 'completed' }).lean()
  const userTotalRevenue = userBookings.reduce((acc, b) => acc + (b.pricingDetails?.providerEarnings || 0), 0)
  const userAvgRevenue = userBookings.length > 0 ? userTotalRevenue / userBookings.length : 0

  // Get user's primary category from their first service
  const firstService = await Service.findOne({ providerId: objectId }).populate('category').lean()
  const categoryId = firstService?.category?._id
  const categoryName = (firstService?.category as any)?.name || 'N/A'

  let categoryAvgRevenue = 0
  if (categoryId) {
    const categoryStats = await Booking.aggregate([
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      { $match: { 'service.category': categoryId, status: 'completed' } },
      {
        $group: {
          _id: null,
          avgRevenue: { $avg: '$pricingDetails.providerEarnings' },
        },
      },
    ])
    categoryAvgRevenue = categoryStats[0]?.avgRevenue || 0
  }

  // 5. Average Order Value
  const averageOrderValue = userAvgRevenue

  // 6. Repeat Rate (Clients with >1 booking / Total unique clients)
  const clientStats = await Booking.aggregate([
    { $match: { providerId: objectId, status: 'completed' } },
    { $group: { _id: '$clientId', bookingCount: { $sum: 1 } } },
  ])
  const repeatClients = clientStats.filter(c => c.bookingCount > 1).length
  const totalClients = clientStats.length
  const repeatRate = totalClients > 0 ? (repeatClients / totalClients) * 100 : 0

  // 7. Average Conversion Time
  // Average time from first view to first booking for each client
  const conversionTimes = await Booking.aggregate([
    { $match: { providerId: objectId, status: 'completed' } },
    {
      $lookup: {
        from: 'analytics',
        let: { clientId: '$clientId', provId: '$providerId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$visitorId', { $toString: '$$clientId' }] },
                  { $eq: ['$providerId', '$$provId'] },
                  { $eq: ['$type', 'view'] },
                ],
              },
            },
          },
          { $sort: { timestamp: 1 } },
          { $limit: 1 },
        ],
        as: 'firstView',
      },
    },
    { $unwind: '$firstView' },
    {
      $project: {
        timeToConvert: {
          $divide: [{ $subtract: ['$createdAt', '$firstView.timestamp'] }, 1000 * 60 * 60], // in hours
        },
      },
    },
    { $group: { _id: null, avgTime: { $avg: '$timeToConvert' } } },
  ])

  const avgConversionTime = conversionTimes[0]?.avgTime || 0

  return {
    mostViewedProject: mostViewed[0] ? {
      serviceId: mostViewed[0]._id.toString(),
      title: mostViewed[0].service.title,
      views: mostViewed[0].views,
    } : null,
    conversionRate,
    bounceRate,
    avgRevenueVsCategory: {
      userAvg: userAvgRevenue,
      categoryAvg: categoryAvgRevenue,
      categoryName,
    },
    averageOrderValue,
    repeatRate,
    avgConversionTime,
  }
}

export const AnalyticsService = {
  trackVisit,
  getPremiumAnalytics,
}
